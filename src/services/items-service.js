import inewsCache from "../1-dal/inews-cache.js";
import itemsHash from "../1-dal/items-hashmap.js";
import sqlService from "./sql-service.js";
import logger from "../utilities/logger.js";
import createTick from "../utilities/time-tick.js";
import lastUpdateService from "../utilities/rundown-update-debouncer.js";
import deleteItemDebouncer from "../utilities/delete-item-debouncer.js"

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

    async registerStoryItems() {

        for (const [itemId, itemProp] of Object.entries(this.story.attachments)) {
            if (itemsHash.isUsed(itemId)) {
                await this.createDuplicate(this.rundownId, this.story, itemId, itemProp.ord, this.rundownStr);
            } else {
                await this.registerNewItem(itemId, itemProp);
            }
        }
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
        
        if (options.updateDuplicates) {
            await this.updateDuplicates(options.item);
            return;
        }

        if (options.clearDuplicates) {
            await this.clearAllDuplicates(options.itemId);
            return;
        }

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
    
    async processStoryItem(itemId, itemProp) {
        const dupId = this.isAlreadyRegistered(itemId, this.cacheAttachmentsIds);
    
        if (dupId) {
            await this.handleDuplicateItem(itemId, dupId, itemProp);
        } else if (!this.cacheAttachmentsIds.includes(itemId) && itemsHash.isUsed(itemId)) {
            await this.handleNewItem(itemId, itemProp);
        } else if (!this.cacheAttachmentsIds.includes(itemId)) {
            await this.registerNewItem(itemId, itemProp);
        } else {
            await this.updateExistingItem(itemId, itemProp);
        }
    }
    
    async handleDuplicateItem(itemId, dupId, itemProp) {
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
    
    async registerNewItem(itemId, itemProp) {
        itemsHash.add(itemId);
        await sqlService.updateItem(this.rundownStr, {
            itemId: itemId,
            rundownId: this.rundownId,
            storyId: this.storyId,
            ord: itemProp.ord
        });
    
        logger(`New item registered in ${this.rundownStr}, story ${this.story.storyName}`);
    }
    
    async updateExistingItem(itemId, itemProp) {
        if (itemProp.ord !== this.cachedAttachments[itemId].ord) {
            await sqlService.updateItemOrd(this.rundownStr, {
                itemId: itemId,
                rundownId: this.rundownId,
                storyId: this.storyId,
                ord: itemProp.ord
            });
            logger(`Item reordered in ${this.rundownStr}, story ${this.story.storyName}`);
        }
    
        if (itemProp.itemSlug !== this.cachedAttachments[itemId].itemSlug) {
            await sqlService.updateItemSlug(this.rundownStr, {
                itemId: itemId,
                rundownId: this.rundownId,
                storyId: this.storyId,
                itemSlug: itemProp.itemSlug
            });
            logger(`Item ${itemProp.itemSlug} modified in ${this.rundownStr}, story ${this.story.storyName}`);
        }
    }
    
    async removeUnusedItems() {
        if (this.cacheAttachmentsIds.length > this.storyAttachmentsIds.length) {
            await Promise.all(this.cacheAttachmentsIds.map(async key => {
                if (!this.storyAttachmentsIds.includes(key)) {
                    deleteItemDebouncer.triggerDeleteItem(this.rundownStr, {
                        itemId: key,
                        rundownId: this.rundownId,
                        storyId: this.storyId,
                    });
                    await this.clearAllDuplicates(key);
                }
            }));
        }
    }

    isAlreadyRegistered(itemId, itemsArr) {
        const matchingItem = itemsArr.find(item => itemsHash.getReferenceItem(item) === itemId);
        return matchingItem ? matchingItem : null; // Return the matching itemId or null if no match found
    }

    async createDuplicateOnExistStory(rundownId, story, referenceItemId, ord, rundownStr) {
        let uid = await inewsCache.getStoryUid(rundownStr, story.identifier);
        const referenceItem = await sqlService.getFullItem(referenceItemId);

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

        logger(`New duplicate item in ${rundownStr}, story ${story.storyName}`);

        return story.attachments;
    }

    async createDuplicate(rundownId, story, referenceItemId, ord, rundownStr) {
        let uid = await inewsCache.getStoryUid(rundownStr, story.identifier);
        const referenceItem = await sqlService.getFullItem(referenceItemId);

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
        logger(`New duplicate item in ${rundownStr}, story ${story.storyName}`);
    }
    
    // Deletes all duplicates of given item from DB and inews-cache
    async clearAllDuplicates(itemId) {
        
        // Returns {itemId: {referenceItemId, rundownStr, storyIdentifier}} or null
        const duplicates = itemsHash.getDuplicatesByReference(itemId); 
        
        if (duplicates) {
            // Use Object.entries to get both the key and value
            for (const [itemId, props] of Object.entries(duplicates)) {
                // Construct item to sqlService.deleteItem func
                const itemToDelete = { itemId: itemId, storyId:props.storyId }
                
                // Delete the item from the database
                await sqlService.deleteItem(props.rundownStr, itemToDelete);
                
                // Delete the associated attachment using rundownStr and storyIdentifier
                inewsCache.deleteSingleAttachment(props.rundownStr, props.storyIdentifier, itemId);

                itemsHash.deleteDuplicate(itemId);
            }
        }
    }
  
    async updateDuplicates(item) {
        if (itemsHash.hasDuplicates(item.gfxItem)) {
            console.log("vah");
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
