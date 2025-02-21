import inewsCache from "../1-dal/inews-cache.js";
import itemsHash from "../1-dal/items-hashmap.js";
import sqlService from "./sql-service.js";
import logger from "../utilities/logger.js";
import duplicateService from "./duplicates-service.js";

class StoryItemManager {
    constructor() {
        this.rundownStr = null;
        this.rundownId = null;
        this.story = {};
        this.cachedStory = {};
        this.storyId = null;
        this.cachedAttachments = {};
        this.storyAttachments = {};
        this.storyAttachmentsIds = [];
        this.cacheAttachmentsIds = [];
    }

    async setGlobalValues(rundownStr, rundownId, story){
        this.rundownStr = rundownStr;
        this.rundownId = rundownId;
        this.story = story;
        this.cachedStory = await inewsCache.getStory(rundownStr, story.identifier);
        this.storyId = this.cachedStory.uid;
        this.cachedAttachments = this.cachedStory.attachments;
        this.storyAttachments = this.story.attachments;
        this.storyAttachmentsIds = Object.keys(this.storyAttachments);
        this.cacheAttachmentsIds = Object.keys(this.cachedAttachments);
        return;
    }

    async itemProcessor(rundownStr, rundownId, story, options={}) {

        await this.setGlobalValues(rundownStr, rundownId, story);
        
        if (options.newStory) {
            await this.registerStoryItems();
            return;
        }
  
        for (const [uuid, item] of Object.entries(this.storyAttachments)) {
            item.rundown = this.rundownId;
            item.story = this.storyId;
            await this.processStoryItem(item);
        }
    
        await this.removeUnusedItems();

    }

    async processStoryItem(item) {
        
        // Is this item has duplicates?
        if(itemsHash.hasDuplicates(item.uuid) && !this.cacheAttachmentsIds.includes(item.uuid)){
            duplicateService.createDuplicate(item);
        }

        // New item in existing modified story
        if (!this.cacheAttachmentsIds.includes(item.uuid)) {
            await this.registerNewItem(item);
        } else  {
            await this.updateExistingItem(item);
        }
    }

    async registerNewItem(item) {
        itemsHash.add(item.uuid);
        const result = await sqlService.upsertItem(item);
        if (result.success) {
            logger(`[ITEM] New item registered in ${this.rundownStr}, story ${this.story.storyName}`);
        } else {
            logger(`[SQL] Update error. Item in ${this.rundownStr}, story {${this.story.storyName}}. Reason: ${result.message}`,"red");
        }
        
    }
       
    async updateExistingItem(item) {
        await sqlService.updateItemDataOrdName(item);
    }

    async registerStoryItems() {

        for (const [uuid, item] of Object.entries(this.storyAttachments)) {
            item.rundown = this.rundownId;
            item.story = this.storyId;
            if (itemsHash.isUsed(item.uuid)) {
                await duplicateService.createDuplicate(item);
            } else {
                await this.registerNewItem(item);
            }
        }
    }
    
    async removeUnusedItems() {
        if (this.cacheAttachmentsIds.length > this.storyAttachmentsIds.length) { 
            await Promise.all(this.cacheAttachmentsIds.map(async uuid => {
                
                if (!this.storyAttachmentsIds.includes(uuid)) {
                    if(itemsHash.hasDuplicates(uuid)){
                        const uid = itemsHash.getDuplicateId(this.storyId, this.rundownId);
                        await sqlService.deleteItemById(uid);
                        itemsHash.removeDuplicate(uid);
                        return;
                    }

                    await sqlService.deleteItem(this.rundownStr, uuid);
                    itemsHash.remove(uuid);
                }
            }));
        }
    }

}

const itemsService = new StoryItemManager();

export default itemsService;
