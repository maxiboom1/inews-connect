import inewsCache from "../1-dal/inews-cache.js";
import itemsHash from "../1-dal/items-hashmap.js";
import sqlService from "./sql-service.js";
import logger from "../utilities/logger.js";
import createTick from "../utilities/time-tick.js";
import lastUpdateService from "../utilities/rundown-update-debouncer.js";
import deleteService from "./delete-service.js"

class StoryItemManager {
    constructor() {
        this.rundownStr = null;
        this.rundownId = null;
        this.story = {};
        this.cachedStory = {};
        this.storyId = null;
        this.cachedAttachments = {};
        this.storyAttachments = {};
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
        this.cacheAttachmentsIds = Object.keys(this.cachedAttachments);
        return;
    }

    async itemProcessor(rundownStr, rundownId, story, options={}) {
        await this.setGlobalValues(rundownStr, rundownId, story);
        if (options.newStory) {
            await this.registerStoryItems();
            return;
        }

        for (const [itemId, itemProp] of Object.entries(this.storyAttachments)) {
            await this.processStoryItem(itemId, itemProp);
        }
    
        await this.removeUnusedItems();
        return story.attachments;
    }
    
    // Here we know that item coming from new story - so all items are new.
    async registerStoryItems() {

        for (const [itemId, item] of Object.entries(this.story.attachments)) {
            if (itemsHash.isUsed(item.uuid)) {
                await this.createDuplicate(this.rundownId, this.story, itemId, item.ord, this.rundownStr);
            } else {
                await this.registerNewItem(itemId, item);
            }
        }
    }
 
    async createDuplicate(rundownId, story, referenceItemId, ord, rundownStr) {
        let uid = await inewsCache.getStoryUid(rundownStr, story.identifier);
        const referenceItem = await sqlService.getFullItem(referenceItemId);
        if(referenceItem){
            referenceItem.rundown = rundownId;
            referenceItem.story = uid;
            referenceItem.ord = ord;
            referenceItem.lastupdate = createTick();
            referenceItem.ordupdate = createTick();
    
            const duplicateItemUid = await sqlService.storeDuplicateItem(referenceItem);
            itemsHash.addDuplicate(referenceItemId, duplicateItemUid, rundownStr, story.identifier, story.uid, story.fileName);
    
            const storyAttachments = await inewsCache.getStoryAttachments(rundownStr, story.identifier);
            delete storyAttachments[referenceItemId];
            const newItem = {
                gfxTemplate: referenceItem.template,
                gfxProduction: referenceItem.production,
                itemSlug: referenceItem.name,
                ord: referenceItem.ord
            }
            storyAttachments[duplicateItemUid] = newItem;
            await inewsCache.setStoryAttachments(rundownStr, story.identifier, storyAttachments);
            logger(`[ITEM] New duplicate item in ${rundownStr}, story ${story.storyName}`);
        } else {
            logger(`[ITEM] New duplicate item in ${rundownStr}, story ${story.storyName} has no master in SQL`,"red");
        }

    }

    async registerNewItem(itemId, item) {
        itemsHash.add(item.uuid);
        item.rundown = Number(this.rundownId);
        item.story = Number(this.storyId);
        
        const result = await sqlService.upsertItem(item);
        if (result.success) {
            logger(`[ITEM] New item restored in ${this.rundownStr}, story ${this.story.storyName}`);
        } else {
            logger(`[SQL] Update error. Item ${item.uuid} in ${this.rundownStr}, story {${this.story.storyName}}. Reason: ${result.message}`,"red");
        }
        
    }
    
    async processStoryItem(itemId, itemProp) {
        const dupId = this.isAlreadyRegistered(itemId, this.cacheAttachmentsIds);
        //case-1
        if (dupId) {
            await this.handleDuplicateItem(itemId, dupId, itemProp);
        //case-2
        } else if (!this.cacheAttachmentsIds.includes(itemId) && itemsHash.isUsed(itemId)) {
            await this.handleNewItem(itemId, itemProp);
        //case-3
        } else if (!this.cacheAttachmentsIds.includes(itemId)) {
            await this.registerNewItem(itemId, itemProp);
        //case-4
        } else {
            await this.updateExistingItem(itemId, itemProp);
        }
    }
    
    async handleDuplicateItem(itemId, dupId, itemProp) {
        
        // This insertion swaps the id from inews to its dupId, and returns in the end for duplicate caching 
        this.story.attachments[dupId] = this.story.attachments[itemId];
        delete this.story.attachments[itemId];
    
        await sqlService.updateItemOrd(this.rundownStr, {
            itemId: dupId,
            rundownId: this.rundownId,
            storyId: this.storyId,
            ord: itemProp.ord
        });
    }
    
    async handleNewItem(itemId, itemProp) {
        this.story.attachments = await this.createDuplicateOnExistStory(this.rundownId, this.story, itemId, itemProp.ord, this.rundownStr);
        itemsHash.add(itemId);
    }
    
    async updateExistingItem(itemId, item) {
        item.rundown = this.rundownId;
        item.story = this.storyId;

        if (item.ord !== this.cachedAttachments[itemId].ord) {
            await sqlService.updateItemOrd(this.rundownStr,item);
            logger(`[ITEM] Item reordered in ${this.rundownStr}, story ${this.story.storyName}`);
        }

        if (item.name !== this.cachedAttachments[itemId].name) {
            await sqlService.updateItemSlugAndData(this.rundownStr, item);
            //await this.updateDuplicates(item);
            logger(`[ITEM] Item ${item.name} modified in ${this.rundownStr}, story ${this.story.storyName}`);
        }
    }
    
    async removeUnusedItems() {
        for (const key of this.cacheAttachmentsIds) {
            if (!Object.keys(this.storyAttachments).includes(key)) {
                const itemToDelete = {
                    itemId: key,
                    rundownId: this.rundownId,
                    storyId: this.storyId,
                };

                await deleteService.triggerDeleteItem(this.rundownStr, itemToDelete, this.story.identifier);
            }
        }    
    }

    isAlreadyRegistered(itemId, itemsArr) {
        const matchingItem = itemsArr.find(item => itemsHash.getReferenceItem(item) === itemId);
        return matchingItem ? matchingItem : null; // Return the matching itemId or null if no match found
    }

    async createDuplicateOnExistStory(rundownId, story, referenceItemId, ord, rundownStr) {
        let uid = await inewsCache.getStoryUid(rundownStr, story.identifier);
        const referenceItem = await sqlService.getFullItem(referenceItemId);
        if(referenceItem){
            referenceItem.rundown = rundownId;
            referenceItem.story = uid;
            referenceItem.ord = ord;
            referenceItem.lastupdate = createTick();
            referenceItem.ordupdate = createTick();
    
            const duplicateItemUid = await sqlService.storeDuplicateItem(referenceItem);
            itemsHash.addDuplicate(referenceItemId, duplicateItemUid, rundownStr, story.identifier, uid, story.fileName);

            delete story.attachments[referenceItemId];
            const newItem = {
                gfxTemplate: referenceItem.template,
                gfxProduction: referenceItem.production,
                itemSlug: referenceItem.name,
                ord: referenceItem.ord
            };
            story.attachments[duplicateItemUid] = newItem;
    
            
    
            return story.attachments;
        } else {
            logger(`[ITEM] New duplicate item in ${rundownStr}, story ${story.storyName} has no master in SQL`,"red");
        }

    }
    
    async updateDuplicates(item) {
        if (itemsHash.hasDuplicates(item.gfxItem)) {
            const referenceItem = await sqlService.getFullItem(item.gfxItem);
            const masterItemRundownStr = await inewsCache.getRundownStr(referenceItem.rundown); // Get original item rundownStr by rundown uid
            const rundownsToUpdateArr = [masterItemRundownStr]; // Add original item rundown to array of rundowns that will be rundownLastUpdate'd
            const storiesToUpdateArr = [];
            const duplicates = itemsHash.getDuplicatesByReference(item.gfxItem);
            if (duplicates === null) return;

            for (const [id, value] of Object.entries(duplicates)) {
                rundownsToUpdateArr.push(value.rundownStr);
                storiesToUpdateArr.push(value.storyId);
                await sqlService.updateItemFromItemsService({
                    "name": referenceItem.name,
                    "data": referenceItem.data,
                    "scripts": referenceItem.scripts,
                    "templateId": referenceItem.template,
                    "productionId": referenceItem.production,
                    "gfxItem": id
                });
            }

            await Promise.all([...new Set(rundownsToUpdateArr)].map(async rundownStr => {
                lastUpdateService.triggerRundownUpdate(rundownStr);
            }));

            await Promise.all([...new Set(storiesToUpdateArr)].map(async storyId => {
                await sqlService.storyLastUpdate(storyId);
            }));
        }
    }
}

const itemsService = new StoryItemManager();

export default itemsService;
