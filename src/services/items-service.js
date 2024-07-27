import inewsCache from "../1-dal/inews-cache.js";
import itemsHash from "../1-dal/items-hashmap.js";
import sqlService from "./sql-service.js";
import logger from "../utilities/logger.js";


/**
 * Handles story modify event.
 * Gets Inews story obj and rundown Str. 
 * Fetch cached story by identifier, compare cache stories with inews stories for create, modify, reorder and delete events.
 * Depends on event, calls updateItem/updateItemOrd/updateItemSlug/deleteItem from sql service.
 * Story expected structure: 
 * { fileType,fileName,identifier,locator,storyName,modified,flags,attachments{gfxItem{gfxTemplate,gfxProduction,itemSlug,ord}} }
 * @param {string} rundownStr 
 * @param {{}} story 
 * @return {void}
 */
async function compareItems(rundownStr, story) {

    const cachedStory = await inewsCache.getStory(rundownStr, story.identifier);
    const storyId = cachedStory.uid;
    const rundownId = await inewsCache.getRundownUid(rundownStr);
    
    const cachedItems = cachedStory.attachments;
    const storyItems = story.attachments;
    const storyKeys = Object.keys(storyItems);
    const cacheStoryKeys = Object.keys(cachedItems);
    
    // Run over story evens (attachments)
    for (const [storyGfxItem, storyProp] of Object.entries(storyItems)) {
        
        // Create item event
        if (!cacheStoryKeys.includes(storyGfxItem)){
            itemsHash.add(storyGfxItem);
            await sqlService.updateItem(rundownStr,{
                itemId: storyGfxItem, 
                rundownId:rundownId, 
                storyId:storyId, 
                ord:storyProp.ord
            });

            logger(`New item registered in ${rundownStr}, story ${story.storyName}`)
        
        // Reorder item event
        } else if(storyProp.ord !== cachedItems[storyGfxItem].ord){
            await sqlService.updateItemOrd(rundownStr,{
                itemId: storyGfxItem, 
                rundownId:rundownId, 
                storyId:storyId, 
                ord:storyProp.ord
            });
            logger(`Item reordered in ${rundownStr}, story ${story.storyName}`);     
        
        // Modify item event
        } else if(storyProp.itemSlug !== cachedItems[storyGfxItem].itemSlug){
            await sqlService.updateItemSlug(rundownStr,{
                itemId: storyGfxItem, 
                rundownId:rundownId, 
                storyId:storyId, 
                itemSlug: storyProp.itemSlug
            });
            logger(`Item ${storyProp.itemSlug} modified in ${rundownStr}, story ${story.storyName}`); 
        }
        
    } 

    // Delete item event
    if(cacheStoryKeys.length > storyKeys.length){
        // Run over cached items
        cacheStoryKeys.forEach(async key =>{
            // Check if key (gfxItem) doesn't exists in story
            if(!storyKeys.includes(key)){
                await sqlService.deleteItem(rundownStr,{
                    itemId: key, // item id to delete
                    rundownId:rundownId, 
                    storyId:storyId, 
                });
            }
    });
    
    } 

}


export default { compareItems };
