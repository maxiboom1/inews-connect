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
        this.cachedItems = {};
        this.storyItems = {};
        this.storyKeys = [];
        this.cacheStoryKeys = [];
    }

    async setGlobalValues(rundownStr, rundownId, story){
        this.rundownStr = rundownStr;
        this.rundownId = rundownId;
        this.story = story;
        this.cachedStory = await inewsCache.getStory(rundownStr, story.identifier);
        this.storyId = this.cachedStory.uid;
        this.cachedItems = this.cachedStory.attachments;
        this.storyItems = this.story.attachments;
        this.storyKeys = Object.keys(this.storyItems);
        this.cacheStoryKeys = Object.keys(this.cachedItems);
        return;
    }

    async compareItems(rundownStr, rundownId, story) {
        await this.setGlobalValues(rundownStr, rundownId, story);
    
        for (const [storyGfxItem, storyProp] of Object.entries(this.storyItems)) {
            await this.processStoryItem(storyGfxItem, storyProp);
        }
    
        await this.removeUnusedItems();
        return story.attachments;
    }
    
    async processStoryItem(storyGfxItem, storyProp) {
        const dupId = this.isAlreadyRegistered(storyGfxItem, this.cacheStoryKeys);
    
        if (dupId) {
            await this.handleDuplicateItem(storyGfxItem, dupId, storyProp);
        } else if (!this.cacheStoryKeys.includes(storyGfxItem) && itemsHash.isUsed(storyGfxItem)) {
            await this.handleNewItem(storyGfxItem, storyProp);
        } else if (!this.cacheStoryKeys.includes(storyGfxItem)) {
            await this.registerNewItem(storyGfxItem, storyProp);
        } else {
            await this.updateExistingItem(storyGfxItem, storyProp);
        }
    }
    
    async handleDuplicateItem(storyGfxItem, dupId, storyProp) {
        this.story.attachments[dupId] = this.story.attachments[storyGfxItem];
        delete this.story.attachments[storyGfxItem];
    
        await sqlService.updateItemOrd(this.rundownStr, {
            itemId: dupId,
            rundownId: this.rundownId,
            storyId: this.storyId,
            ord: storyProp.ord
        });
    }
    
    async handleNewItem(storyGfxItem, storyProp) {
        this.story.attachments = await this.createDuplicateOnExistStory(this.rundownId, this.story, storyGfxItem, storyProp.ord, this.rundownStr);
        itemsHash.add(storyGfxItem);
    }
    
    async registerNewItem(storyGfxItem, storyProp) {
        itemsHash.add(storyGfxItem);
        await sqlService.updateItem(this.rundownStr, {
            itemId: storyGfxItem,
            rundownId: this.rundownId,
            storyId: this.storyId,
            ord: storyProp.ord
        });
    
        logger(`New item registered in ${this.rundownStr}, story ${this.story.storyName}`);
    }
    
    async updateExistingItem(storyGfxItem, storyProp) {
        if (storyProp.ord !== this.cachedItems[storyGfxItem].ord) {
            await sqlService.updateItemOrd(this.rundownStr, {
                itemId: storyGfxItem,
                rundownId: this.rundownId,
                storyId: this.storyId,
                ord: storyProp.ord
            });
            logger(`Item reordered in ${this.rundownStr}, story ${this.story.storyName}`);
        }
    
        if (storyProp.itemSlug !== this.cachedItems[storyGfxItem].itemSlug) {
            await sqlService.updateItemSlug(this.rundownStr, {
                itemId: storyGfxItem,
                rundownId: this.rundownId,
                storyId: this.storyId,
                itemSlug: storyProp.itemSlug
            });
            logger(`Item ${storyProp.itemSlug} modified in ${this.rundownStr}, story ${this.story.storyName}`);
        }
    }
    
    async removeUnusedItems() {
        if (this.cacheStoryKeys.length > this.storyKeys.length) {
            await Promise.all(this.cacheStoryKeys.map(async key => {
                if (!this.storyKeys.includes(key)) {
                    await sqlService.deleteItem(this.rundownStr, {
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

        itemsHash.addDuplicate(referenceItemId, duplicateItemUid, rundownStr, story.identifier);

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

    async registerStoryItems(rundownStr, story) {
        const rundownId = await inewsCache.getRundownUid(rundownStr);

        for (const [storyGfxItem, storyProp] of Object.entries(story.attachments)) {
            if (itemsHash.isUsed(storyGfxItem)) {
                await this.createDuplicate(rundownId, story, storyGfxItem, storyProp.ord, rundownStr);
            } else {
                await sqlService.updateItem(rundownStr, {
                    itemId: storyGfxItem,
                    rundownId: rundownId,
                    storyId: story.uid,
                    ord: storyProp.ord
                });
                itemsHash.add(storyGfxItem);
                logger(`New item registered in ${rundownStr}, story ${story.storyName}`);
            }
        }
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
        itemsHash.addDuplicate(referenceItemId, duplicateItemUid, rundownStr, story.identifier, story.uid);

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

        if (itemsHash.isUsed(item.gfxItem)) {
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
