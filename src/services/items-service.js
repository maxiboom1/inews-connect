import inewsCache from "../1-dal/inews-cache.js";
import sqlService from "./sql-service.js";

// Its triggered while inews story has been modified
async function compareItems(rundownStr, story) {
    // gfxItem(uid): { gfxTemplate: 10005, gfxProduction: 2, itemSlug: 'asd', ord: 1 }
    const cachedStory = await inewsCache.getStory(rundownStr, story.identifier);
    const storyId = cachedStory.uid;
    const rundownId = await inewsCache.getRundownUid(rundownStr);
    const cachedItems = cachedStory.attachments;
    const storyItems = story.attachments;
    
    // Run over story evens (attachments)
    for (const [storyGfxItem, storyProp] of Object.entries(storyItems)) {
        
        // Create event
        if (!Object.keys(cachedItems).includes(storyGfxItem)){
            
            await sqlService.updateItem(rundownStr,{
                itemId: storyGfxItem, 
                rundownId:rundownId, 
                storyId:storyId, 
                ord:storyProp.ord
            });

            console.log(`New item registered in ${rundownStr}, story ${story.storyName}`)
        } else if(storyProp.ord !== cachedItems[storyGfxItem].ord){
            await sqlService.updateItemOrd(rundownStr,{
                itemId: storyGfxItem, 
                rundownId:rundownId, 
                storyId:storyId, 
                ord:storyProp.ord
            });
            console.log(`Item reordered...`);     
        }
        
      } 

}

export default { compareItems };
