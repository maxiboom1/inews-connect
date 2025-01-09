import inewsCache from "../1-dal/inews-cache.js";
import itemsHash from "../1-dal/items-hashmap.js";
import sqlService from "./sql-service.js";
import logger from "../utilities/logger.js";
import createTick from "../utilities/time-tick.js";

// Gets itemUid and cachedItemsUid arr, should check if in array exists item with reference that match given item id
function isAlreadyRegistered(itemId, itemsArr) {
    const matchingItem = itemsArr.find(item => itemsHash.getReferenceItem(item) === itemId);
    return matchingItem ? matchingItem : null; // Return the matching itemId or null if no match found
}

async function compareItems(rundownStr, rundownId, story) {
    const cachedStory = await inewsCache.getStory(rundownStr, story.identifier);
    const storyId = cachedStory.uid;

    // Get Items obj. Expect struct: {uid:{gfxTemplate,gfxProduction,itemSlug,ord}}
    const cachedItems = cachedStory.attachments;
    const storyItems = story.attachments;
    
    // Create arr of items uid's
    const storyKeys = Object.keys(storyItems); 
    const cacheStoryKeys = Object.keys(cachedItems);
    
    // Run over story attachment. storyGfxItem = uid. storyProp = {gfxTemplate,gfxProduction,itemSlug,ord}
    for (const [storyGfxItem, storyProp] of Object.entries(storyItems)) {
        const dupId = isAlreadyRegistered(storyGfxItem, cacheStoryKeys);
        
        if(dupId){
            story.attachments[dupId] = story.attachments[storyGfxItem];
            delete story.attachments[storyGfxItem];
            // Duplicate reorder
            await sqlService.updateItemOrd(rundownStr, {
                itemId: dupId,
                rundownId: rundownId,
                storyId: storyId,
                ord: storyProp.ord
            });
        }

        // New duplicate 
        if(!cacheStoryKeys.includes(storyGfxItem) && itemsHash.isUsed(storyGfxItem)){
            if(!dupId){
                story.attachments = await createDuplicateOnExistStory(rundownId,story,storyGfxItem,storyProp.ord,rundownStr);
                itemsHash.add(storyGfxItem);
            } else{
                story.attachments[dupId] = story.attachments[storyGfxItem];
                delete story.attachments[storyGfxItem];
            }
            continue; 
        } 

        // Create item event
        if (!cacheStoryKeys.includes(storyGfxItem)) {
            itemsHash.add(storyGfxItem);
            await sqlService.updateItem(rundownStr, {
                itemId: storyGfxItem,
                rundownId: rundownId,
                storyId: storyId,
                ord: storyProp.ord
            });

            logger(`New item registered in ${rundownStr}, story ${story.storyName}`)
            continue;
        }

        // Reorder item event
        if (storyProp.ord !== cachedItems[storyGfxItem].ord) {
            await sqlService.updateItemOrd(rundownStr, {
                itemId: storyGfxItem,
                rundownId: rundownId,
                storyId: storyId,
                ord: storyProp.ord
            });
            logger(`Item reordered in ${rundownStr}, story ${story.storyName}`);      
        }
        
        // Modify item event
        if (storyProp.itemSlug !== cachedItems[storyGfxItem].itemSlug) {
            await sqlService.updateItemSlug(rundownStr, {
                itemId: storyGfxItem,
                rundownId: rundownId,
                storyId: storyId,
                itemSlug: storyProp.itemSlug
            });
            logger(`Item ${storyProp.itemSlug} modified in ${rundownStr}, story ${story.storyName}`);

        }

    }

    // Delete item event
    if (cacheStoryKeys.length > storyKeys.length) {
        // Run over cached items
        cacheStoryKeys.forEach(async key => {
            // Check if key (gfxItem) doesn't exists in story
            if (!storyKeys.includes(key)) {
                await sqlService.deleteItem(rundownStr, {
                    itemId: key, // item id to delete
                    rundownId: rundownId,
                    storyId: storyId,
                });
                clearAllDuplicates(key);
            }
        });

    }

    return story.attachments;
}


async function createDuplicateOnExistStory(rundownId, story, referenceItemId,ord,rundownStr) {
    // Get story id from cache
    let uid = await inewsCache.getStoryUid(rundownStr,story.identifier);
    // Get original item from sql
    const referenceItem = await sqlService.getFullItem(referenceItemId);
    
    // Modify original properties
    referenceItem.rundown = rundownId;
    referenceItem.story = uid;
    referenceItem.ord = ord
    referenceItem.lastupdate = createTick();
    referenceItem.ordupdate = createTick();
    
    // Save as duplicate and get asserted id
    const duplicateItemUid = await sqlService.storeDuplicateItem(referenceItem);
    
    // Save duplicate and its reference ids to items cache
    itemsHash.addDuplicate(referenceItemId, duplicateItemUid, rundownStr, story.identifier);
    
    // Modify cached story attachments with duplicates
    delete story.attachments[referenceItemId];
    const newItem = {
        gfxTemplate:referenceItem.template,
        gfxProduction:referenceItem.production,
        itemSlug:referenceItem.name ,
        ord: referenceItem.ord
    }
    story.attachments[duplicateItemUid] = newItem;
    
    logger(`New duplicate item in ${rundownStr}, story ${story.storyName}`)

    return story.attachments;    

}


async function registerStoryItems(rundownStr, story) {
    const rundownId = await inewsCache.getRundownUid(rundownStr);

    // Run over story attachments
    for (const [storyGfxItem, storyProp] of Object.entries(story.attachments)) {

        if (itemsHash.isUsed(storyGfxItem)) {
            await createDuplicate(rundownId,story,storyGfxItem,storyProp.ord,rundownStr);
        } else {
            await sqlService.updateItem(rundownStr, {
                itemId: storyGfxItem,
                rundownId: rundownId,
                storyId: story.uid,
                ord: storyProp.ord
            });
            itemsHash.add(storyGfxItem); // Register item in hash as used
            logger(`New item registered in ${rundownStr}, story ${story.storyName}`)
        }
    }
}


async function createDuplicate(rundownId, story, referenceItemId,ord,rundownStr) {
    
    // Get story id from cache
    let uid = await inewsCache.getStoryUid(rundownStr,story.identifier);

    // Get original item from sql
    const referenceItem = await sqlService.getFullItem(referenceItemId);
    
    // Modify original properties
    referenceItem.rundown = rundownId;
    referenceItem.story = uid;
    referenceItem.ord = ord
    referenceItem.lastupdate = createTick();
    referenceItem.ordupdate = createTick();
    
    // Save as duplicate and get asserted id
    const duplicateItemUid = await sqlService.storeDuplicateItem(referenceItem);
    // Save duplicate and its reference ids to items cache
    itemsHash.addDuplicate(referenceItemId,duplicateItemUid, rundownStr, story.identifier, story.uid);
    
    // Modify cached story attachments with duplicates
    const storyAttachments = await inewsCache.getStoryAttachments(rundownStr,story.identifier);
    delete storyAttachments[referenceItemId];
    const newItem = {
        gfxTemplate:referenceItem.template,
        gfxProduction:referenceItem.production,
        itemSlug:referenceItem.name,
        ord: referenceItem.ord
    }
    storyAttachments[duplicateItemUid] = newItem;
    
    await inewsCache.setStoryAttachments(rundownStr,story.identifier,storyAttachments);
    
    logger(`New duplicate item in ${rundownStr}, story ${story.storyName}`)

}

// Deletes all duplicates of given item from DB and inews-cache
async function clearAllDuplicates(itemId){
    
    const duplicates = itemsHash.getDuplicatesByReference(itemId); // Returns {itemId: {referenceItemId, rundownStr, storyIdentifier}} or null
    if(duplicates){
        Object.keys(duplicates).forEach(async itemId => {
            const props = duplicates[itemId]; // Get the properties associated with the itemId
    
            // Delete the item from the database
            await sqlService.deleteItemById(itemId); 
    
            // Delete the associated attachment using rundownStr and storyIdentifier
            inewsCache.deleteSingleAttachment(props.rundownStr, props.storyIdentifier, itemId);
    
            itemsHash.deleteDuplicate(itemId);
        });
    }
    
}

async function updateDuplicates(item){// Expect: {name, data, scripts, templateId, productionId, gfxItem}
    
    if(itemsHash.isUsed(item.gfxItem)){
        const referenceItem = await sqlService.getFullItem(item.gfxItem);
        const rundownsToUpdateArr = [];
        const storiesToUpdateArr = [];
        const duplicates = itemsHash.getDuplicatesByReference(item.gfxItem);
        if (duplicates ===null) return;

        for (const [id, value] of Object.entries(duplicates)) { 
            rundownsToUpdateArr.push(value.rundownStr);
            storiesToUpdateArr.push(value.storyId)
            await sqlService.updateItemFromItemsService({
                "name":referenceItem.name,
                "data":referenceItem.data,
                "scripts":referenceItem.scripts,
                "templateId":referenceItem.template,
                "productionId":referenceItem.production,
                "gfxItem":id

            });
        }
        
        for (const rundownStr of [...new Set(rundownsToUpdateArr)]) { // Use Set to avoid duplicates
            await sqlService.rundownLastUpdate(rundownStr);
        }
        for (const storyId of [...new Set(storiesToUpdateArr)]) { // Use Set to avoid duplicates
            await sqlService.storyLastUpdate(storyId);
        }

    }
}

export default { compareItems, registerStoryItems, clearAllDuplicates, updateDuplicates};