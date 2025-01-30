import sqlService from "./sql-service.js";
import itemsHash from "../1-dal/items-hashmap.js";
import { logger, warn } from "../utilities/logger.js";
import processor from "./inews-service.js";
import appConfig from "../utilities/app-config.js";
import inewsCache from "../1-dal/inews-cache.js";

class DeleteService {
    
    constructor() {
        this.cutItemTimeout = appConfig.cutItemTimeout;
        this.rundownStr = "";
        this.item = {}; //{itemId,rundownId,storyId}
        this.storyIdentifier = "";
    }

    async setGlobals(rundownStr, item, storyIdentifier){
        this.rundownStr = rundownStr;
        this.item = item;
        this.storyIdentifier = storyIdentifier;
    }

    async triggerDeleteItem(rundownStr, item, storyIdentifier){ // Item {itemId,rundownId,storyId}
        
        await this.setGlobals(rundownStr, item, storyIdentifier);
        
        // In case This item already been cleared before
        if(this.itemNotExists()) return;

        // Delete duplicate and its cache
        if(itemsHash.isDuplicate(this.item.itemId)){
            await this.deleteItemCache();
            const result = await this.executeDeleteItem(this.rundownStr, this.item);
            
            const story = await inewsCache.getStory(rundownStr, storyIdentifier);
            if (result.success) {
                logger(`[ITEM] Duplicate in {${rundownStr}}, story {${story.storyName}} deleted.`);
            } else {
                warn(`[SQL] Error on delete duplicate ${item.itemId} in {${rundownStr}}, story {${story.storyName}}. Reason: ${result.message}`);
            }
            return;
        }
        
        let duplicateFileNames = {};
        
        // If hasDuplicates, collect duplicates for resync, and delete them
        if(itemsHash.hasDuplicates(this.item.itemId)){
            duplicateFileNames = itemsHash.getDuplicateStoryIdentifiers(this.item.itemId);
            await this.deleteDuplicates(this.item.itemId);
        }

        await this.disableItem();
        
        await this.deleteItemCache();

        setTimeout(() => {
            this.checkDeleteCondition(rundownStr, item, duplicateFileNames, this.storyIdentifier);
        }, this.cutItemTimeout); 

    }  

    async deleteDuplicates() {
    
        // Returns {itemId: {referenceItemId, rundownStr, storyIdentifier}} or null
        const duplicates = itemsHash.getDuplicatesByReference(this.item.itemId); 
        
        for (const [itemId, props] of Object.entries(duplicates)) {
            const itemToDelete = { itemId: itemId, storyId:props.storyId }
            await this.deleteItemCache(props.rundownStr, itemId, props.storyIdentifier);
            
            const result = await this.executeDeleteItem(props.rundownStr, itemToDelete);
            
            // This part is for logger system
            const storyName = await inewsCache.getStoryName(props.rundownStr, props.storyIdentifier);
            if (result.success) {
                logger(`[ITEM] Duplicate in {${props.rundownStr}}, story {${storyName}} deleted.`);
            } else {
                warn(`[SQL] Error on delete duplicate ${itemId} in {${props.rundownStr}}, story {${storyName}}. Reason: ${result.message}`);
            }
        }
        
    }

    async disableItem(){
        const result = await sqlService.disableItem(this.item);
        const storyName = await inewsCache.getStoryName(this.rundownStr, this.storyIdentifier);
        if (result.success) {
            logger(`[ITEM] Item in ${this.rundownStr}, story ${storyName} has been disabled.`);
        } else {
            warn(`[SQL] Update error. Item ${this.item.itemId} in ${this.rundownStr}, story {${storyName}}. Reason: ${result.message}`);
        }

    }

    // This func executed in delay, so all arg must bu supported
    async checkDeleteCondition(rundownStr, item, duplicateFileNames, storyIdentifier) {
        
        if (itemsHash.isUsed(item.itemId)) {
            this.handleRevokedItem(item.itemId, duplicateFileNames);
        } else {
            const result = await this.executeDeleteItem(rundownStr, item);
            let storyName = await inewsCache.getStoryName(rundownStr, storyIdentifier);
            if(storyName === null) storyName = "!deleted!";
            if (result.success) {
                logger(`[ITEM] Item in {${rundownStr}}, story {${storyName}} deleted.`);
            } else {
                warn(`[SQL] Error on delete item ${item.itemId} in {${rundownStr}}, story {${storyName}}. Reason: ${result.message}`);
            }
            
        }
    }

    handleRevokedItem(itemId, duplicateFileNames) {
        if (Object.keys(duplicateFileNames).length > 0) {
            logger(`[ITEM] Item ${itemId} revoked, and has duplicates: ${duplicateFileNames}. Re-sync triggered.`);
            processor.setSyncStory(duplicateFileNames);
        } else {
            logger(`[ITEM] Item ${itemId} revoked! Probably due to cut/paste.`);
        }
    }

    async deleteItemCache(rundownStr = this.rundownStr, itemId = this.item.itemId, storyIdentifier = this.storyIdentifier){
        await inewsCache.deleteSingleAttachment(rundownStr,storyIdentifier,itemId);
        await itemsHash.deleteDuplicate(itemId);
        itemsHash.remove(itemId);
    }

    itemNotExists() {
        return !itemsHash.isUsed(this.item.itemId) && !itemsHash.isDuplicate(this.item.itemId);
    }

    async executeDeleteItem(rundownStr, item) {
        try {
            const result = await sqlService.deleteItem(rundownStr, item);
            return result;  
        } catch (error) {
            console.error('[Delete Service] Error executing item delete:', error);
        }
    }
  
}

const deleteService = new DeleteService();

export default deleteService;
