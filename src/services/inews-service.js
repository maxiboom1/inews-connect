import conn from "../1-dal/inews-ftp.js"
import appConfig from "../utilities/app-config.js";
import hebDecoder from "../utilities/hebrew-decoder.js";
import sqlService from "./sql-service.js";
import inewsCache from "../1-dal/inews-cache.js";
import xmlParser from "../utilities/xml-parser.js";

async function startMainProcess() { 
    console.log('Starting Inews-connect 1.6.8 ...');
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
                        const storyAttachments = await getStoryAttachments(rundownStr, listItem.fileName);
                        listItem.attachments = storyAttachments; //return {gfxItem: { gfxTemplate, gfxProduction, itemSlug, ord }}
                        // Set enabled
                        if(isEmpty(storyAttachments)){listItem.enabled = 0} else {listItem.enabled = 1}

                        // Save story and attachment to db 
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
                            const storyAttachments = await getStoryAttachments(rundownStr, listItem.fileName);
                            // Set enabled
                            if(isEmpty(storyAttachments)){listItem.enabled = 0} else {listItem.enabled = 1}
                            listItem.attachments =storyAttachments; //return {gfxItem: { gfxTemplate, gfxProduction, itemSlug, ord }}
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

/**
 * Retrieves story attachments and parses them.
 * 
 * @param {string} rundownStr - The rundown string.
 * @param {string} fileName - The file name.
 * @returns {Promise<{gfxItem: {gfxTemplate: number, gfxProduction: number, itemSlug: string, ord: number}}>} 
 */
async function getStoryAttachments(rundownStr, fileName){
    const storyPromise = conn.story(rundownStr, fileName);
    const story = await storyPromise;
    return xmlParser.parseAttachments(story.attachments); //return {gfxItem: { gfxTemplate, gfxProduction, itemSlug, ord }}
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

conn.on('connections', connections => {
    console.log(connections + ' FTP connections active');
});


export default {
    startMainProcess
};