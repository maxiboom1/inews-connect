import conn from "../1-dal/inews-ftp.js"
import appConfig from "../utilities/app-config.js";
import hebDecoder from "../utilities/hebrew-decoder.js";
import sqlService from "./sql-service.js";
import inewsCache from "../1-dal/inews-cache.js";
import xmlParser from "../utilities/xml-parser.js";
import itemHash from "../1-dal/items-hashmap.js";

async function startMainProcess() { 
    console.log('Starting Inews-connect 1.8.11 ...');
    await sqlService.initialize();
    await rundownIterator();
}

async function rundownIterator() {
    
    //console.time("Debug: Rundown Iteration process time:");
    const rundowns = await inewsCache.getRundownsArr(); 
    for(const rundownStr of rundowns){
        await rundownProcessor(rundownStr);
    }
    setTimeout(rundownIterator, appConfig.pullInterval);
    //console.timeEnd("Debug: Rundown Iteration process time:"); 
}

/**
 * As we use more than 1 ftp connection, there is a need to handle parallelism in the code.
 * Implemented common method is iterable of promises storyPromises.
 * Types of story change that handled: story deleted, story added, story modified, story float, list order changed
 * In the end, we make sure that all jobs are finished with Promise.all(storyPromises)
 * @param {*} rundownStr - rundown string to process.
 */
async function rundownProcessor(rundownStr) {
    
    try {
        const listItems = await conn.list(rundownStr);
        const storyPromises = listItems
            .filter(listItem => listItem.fileType === 'STORY')
            .map(async (listItem, index) => {
                try {
                    const isStoryExists = await inewsCache.isStoryExists(rundownStr,listItem.identifier);
                    listItem.storyName = hebDecoder(listItem.storyName);
                    
                    // Create new story
                    if(!isStoryExists){
                        const story = await getStory(rundownStr, listItem.fileName);
                        listItem.attachments = xmlParser.parseAttachments(story); //return {gfxItem: { gfxTemplate, gfxProduction, itemSlug, ord }}
                        listItem.pageNumber = story.fields.pageNumber;
                        // Set enabled
                        if(isEmpty(listItem.attachments)){listItem.enabled = 0} else {listItem.enabled = 1}
                        const assertedStoryUid = await sqlService.addDbStory(rundownStr,listItem,index);
                        listItem.uid = assertedStoryUid;
                        // Save to cache
                        await inewsCache.saveStory(rundownStr, listItem, index);  

                    } else{
                        
                        const action = await checkStory(rundownStr,listItem,index); // Compare inews version with cached
                        
                        // Reorder story 
                        if(action === "reorder"){
                            await sqlService.reorderDbStory(rundownStr,listItem,index);
                            await inewsCache.reorderStory(rundownStr,listItem,index);
                        
                        // Modify story
                        }else if(action === "modify"){
                            
                            const story = await getStory(rundownStr, listItem.fileName);
                            listItem.attachments = xmlParser.parseAttachments(story); //return {gfxItem: { gfxTemplate, gfxProduction, itemSlug, ord }}
                            listItem.pageNumber = story.fields.pageNumber;                            
                            
                            // Set enabled
                            if(isEmpty(listItem.attachments)){listItem.enabled = 0} else {listItem.enabled = 1}
                            await sqlService.modifyDbStory(rundownStr,listItem);
                            await inewsCache.modifyStory(rundownStr,listItem);
                        }
                    }
                    
                    
                } catch (error) {
                    console.error(`ERROR at Index ${index}:`, error);
                }
            });
        
        // Wait for all promises to settle
        await Promise.all(storyPromises);

        // Delete stories  
        if(listItems.length < await inewsCache.getRundownLength(rundownStr)){
            deleteDif(rundownStr,listItems);
        }

    } catch (error) {
        console.error("Error fetching and processing stories:", error);
    }
}

async function checkStory(rundownStr ,story, index) {
    
    const cacheStory = await inewsCache.getStory(rundownStr, story.identifier);
    // Reorder
    if(index != cacheStory.ord){
        return "reorder";
    };

    // Modify
    if(story.locator != cacheStory.locator){
        return "modify"
    };
    
    // No changes
    return false;
}

async function deleteDif(rundownStr,listItems) {
    
    // Create hash for inews identifiers
    const inewsHashMap = {};
    // Get cached story identifiers
    const cachedIdentifiers = await inewsCache.getRundownIdentifiersList(rundownStr);
    // Store inews identifiers in hash
    for(const listItem of listItems){
        inewsHashMap[listItem.identifier] = 1;
    }
    // Filter identifiers that in cache but not in inews
    const identifiersToDelete = cachedIdentifiers.filter(identifier => !inewsHashMap.hasOwnProperty(identifier));
    // Delete from cache and mssql
    identifiersToDelete.forEach(async identifier=>{
        await sqlService.deleteStory(rundownStr,identifier);
        await inewsCache.deleteStory(rundownStr,identifier);
    });
}

async function getStory(rundownStr, fileName){
    const storyPromise = conn.story(rundownStr, fileName);
    const story = await storyPromise;
    return story;
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

// To use: updateStory(story.id, story, rundownStr);
async function updateStory(storyId,modifiedStory,rundownStr) {
    const storyData = "<storyid>"+storyId; // Example story data in NSML format
    console.log("triggered mod...", rundownStr);
    try {
      const response = await conn.stor(storyData,modifiedStory, rundownStr);
      console.log(response);
    } catch (error) {
      console.error("Error updating story:", error);
    }
}

async function checkForDuplicatedItems(rundownStr, story){
    const attachmentsIdArr = Object.keys(story.attachments);
    attachmentsIdArr.forEach(async (itemId)=>{
        if(itemHash.isUsed(itemId)){
            
            // Fetch duplicated item 
            const originItem = await sqlService.getFullItem(itemId);
            originItem.templateId = originItem.template;
            originItem.productionId = originItem.production;
            
            // Store copy and get new uid
            const assertedUid = await sqlService.storeNewItem(originItem);

            console.log(assertedUid);

            conn.storyNsml(rundownStr, story.fileName)
        			    .then(story => {
        					const updatedStory = story.replace(`<gfxItem>${itemId}</gfxItem>`,`<gfxItem>${assertedUid}</gfxItem>`);
                            updateStory(story.fileName,updatedStory,rundownStr);
        				})
        				.catch(error => {
        					console.error("ERROR", error);
        				});
        }
    });
}

conn.on('connections', connections => {
    console.log(connections + ' FTP connections active');
});
export default {
    startMainProcess
};