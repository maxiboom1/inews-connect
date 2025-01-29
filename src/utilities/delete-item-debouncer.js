import sqlService from "../services/sql-service.js";
import itemsHash from "../1-dal/items-hashmap.js";
import logger from "./logger.js";
import processor from "../services/inews-service.js";
import appConfig from "./app-config.js";
import inewsCache from "../1-dal/inews-cache.js";

class DeleteItemDebouncer {
    
    constructor() {
        this.cutItemTimeout = appConfig.cutItemTimeout;
    }

    async triggerDeleteItem(rundownStr, item, storyIdentifier){

        if(itemsHash.isDuplicate(item.itemId)){
            await this.executeDeleteItem(rundownStr, item);
            await this.deleteItemCache(rundownStr, item, storyIdentifier);
            return;
        }
        
        let duplicateFileNames = [];
        
        if(itemsHash.hasDuplicates(item.itemId)){
            duplicateFileNames = itemsHash.getDuplicateStoryIdentifiers(item.itemId);
            await this.deleteDuplicates(item.itemId);
        }

        // Set disabled and clear cache
        await sqlService.disableItem(rundownStr, item);
        await this.deleteItemCache(rundownStr, item.itemId, storyIdentifier);

        setTimeout(() => {
            this.checkDeleteCondition(rundownStr, item, duplicateFileNames);
        }, this.cutItemTimeout); 

    }
    

    async checkDeleteCondition(rundownStr, item, duplicateFileNames) {
        const { itemId } = item;
        if (itemsHash.isUsed(itemId)) {
            this.handleRevokedItem(itemId, duplicateFileNames);
        } else {
            this.executeDeleteItem(rundownStr, item);
        }
    }

    async executeDeleteItem(rundownStr, item) {
        try {
            await sqlService.deleteItem(rundownStr, item);  
        } catch (error) {
            console.error('Error executing item delete:', error);
        }
    }

    async deleteDuplicates(itemId) {
    
        // Returns {itemId: {referenceItemId, rundownStr, storyIdentifier}} or null
        const duplicates = itemsHash.getDuplicatesByReference(itemId); 
        
        for (const [itemId, props] of Object.entries(duplicates)) {
            const itemToDelete = { itemId: itemId, storyId:props.storyId }
            await this.executeDeleteItem(props.rundownStr, itemToDelete);
            await this.deleteItemCache(props.rundownStr, itemId, props.storyIdentifier);
        }
        
    }

    handleRevokedItem(itemId, duplicateFileNames) {
        if (duplicateFileNames.length > 0) {
            logger(`Item ${itemId} revoked, and has duplicates: ${duplicateFileNames}. Re-sync triggered.`);
            processor.setSyncStoryFileNames(duplicateFileNames);
        } else {
            logger(`Item ${itemId} revoked! Probably due to cut/paste.`);
        }
    }

    async deleteItemCache(rundownStr, itemId, storyIdentifier){
        await inewsCache.deleteSingleAttachment(rundownStr,storyIdentifier,itemId);
        await itemsHash.deleteDuplicate(itemId);
        await itemsHash.remove(itemId);
        console.log(rundownStr, itemId, storyIdentifier)
    }
    
}

const deleteItemDebouncer = new DeleteItemDebouncer();

export default deleteItemDebouncer;
