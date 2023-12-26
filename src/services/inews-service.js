import conn from "../dal/inews-ftp.js"
import appConfig from "../utilities/app-config.js";
import hebDecoder from "../utilities/hebrew-decoder.js";
import lineupExists from "../utilities/lineup-validator.js";
import logger from "../utilities/logger.js";
import sqlAccess from "./sql-service.js";
import cloneCache from "../dal/clone-cache.js";

async function startMainProcess() { 
    console.log('Starting Inews-connect 1.5.0 ...');
    await sqlAccess.initialize();
    await rundownIterator();

}

async function rundownIterator() {
    
    console.time("Debug: Rundown Iteration process time:");
    const rundowns = await sqlAccess.getCachedRundowns();
    for(const [rundownStr] of Object.entries(rundowns)){
        const valid = await lineupExists(rundownStr); // Maybe we should avoid that?
        if (valid) {
            await rundownProcessor(rundownStr);
        } else {
            logger(`Error! Lineup "${rundownStr}" N/A`, true);
        }
    }
    setTimeout(rundownIterator, appConfig.pullInterval);
    console.timeEnd("Debug: Rundown Iteration process time:"); 
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
                    const isStoryExists = await cloneCache.isStoryExists(rundownStr,listItem.identifier);
                    listItem.storyName = hebDecoder(listItem.storyName);
                    
                    // Create new story
                    if(!isStoryExists){
                        const storyPromise = conn.story(rundownStr, listItem.fileName);
                        const story = await storyPromise;
                        listItem.attachments = story.attachments; // Add attachment to listItem to avoid pass story to store funcs
                        await sqlAccess.addDbStory(rundownStr,listItem,index);
                        await cloneCache.saveStory(rundownStr,listItem,index);
                    } else{
                        
                        const action = await checkStory(rundownStr,listItem,index); // Compare inews version with cached
                        // Reorder story
                        if(action === "reorder"){
                            await sqlAccess.reorderDbStory(rundownStr,listItem,index);
                            await cloneCache.reorderStory(rundownStr,listItem,index);
                        
                        // Modify story
                        }else if(action === "modify"){
                            const storyPromise = conn.story(rundownStr, listItem.fileName);
                            const story = await storyPromise;
                            listItem.attachments = story.attachments; // Add attachment to listItem to avoid pass story to store funcs
                            await sqlAccess.modifyDbStory(rundownStr,listItem);
                            await cloneCache.modifyStory(rundownStr,listItem);
                        }
                    }
                    
                    
                } catch (error) {
                    console.error(`ERROR at Index ${index}:`, error);
                }
            });
        
        // Wait for all promises to settle
        await Promise.all(storyPromises);

        // Delete stories  
        if(listItems.length < await cloneCache.getRundownLength(rundownStr)){
            deleteDif(rundownStr,listItems);
        }

    } catch (error) {
        console.error("Error fetching and processing stories:", error);
    }
}

async function checkStory(rundownStr ,story, index) {
    
    const cacheStory = await cloneCache.getStory(rundownStr, story.identifier);
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
    const cachedIdentifiers = await cloneCache.getRundownIdentifiersList(rundownStr);
    // Store inews identifiers in hash
    for(const listItem of listItems){
        inewsHashMap[listItem.identifier] = 1;
    }
    // Filter identifiers that in cache but not in inews
    const identifiersToDelete = cachedIdentifiers.filter(identifier => !inewsHashMap.hasOwnProperty(identifier));
    // Delete from cache and mssql
    identifiersToDelete.forEach(async identifier=>{
        await cloneCache.deleteStory(rundownStr,identifier);
        await sqlAccess.deleteDBStories(rundownStr,identifier);
    });
}

conn.on('connections', connections => {
    console.log(connections + ' connections active');
});

export default {
    startMainProcess
};


/*
// Old, lineup processor without parallelism

async function processLineup(rundownStr) {
    
    const lineupList = await conn.list(rundownStr); // Get lineup list from inews
    const cachedStories = await inewsCache.getStoryCache(rundownStr);
    for(let i = 0; i < lineupList.length; i++) {
        const story = lineupList[i];
        story.storyName = hebDecoder(lineupList[i].storyName);
        const cachedStory = cachedStories.find(item => item.identifier === lineupList[i].identifier);
         
        // Create new story 1
        if(cachedStory === undefined){
            const expandedStoryData = await conn.story(rundownStr, story.fileName); // Get expanded story data from inews
            await sqlAccess.addDbStory(rundownStr, story,i);
            await cloneCache.saveStory(
                rundownStr,
                i,
                {
                    identifier: story.identifier,
                    storyName: story.storyName,
                    locator: story.locator,
                    flags: story.flags,
                    attachments: story.attachments,
                    index: i
                },
                {
                    attachments: expandedStoryData.attachments // Only pass necessary properties
                }
            );
        } else {
            const action = checkStory(story, cachedStory, i); // Compare inews version with cached
            if(action === "reorder"){
                // Reorder
                await sqlAccess.reorderDbStory(story, i, rundownStr);
                await cloneCache.reorderStory(rundownStr,{identifier:story.identifier,locator:story.locator},i);

            }else if(action === "modify"){
                
                await sqlAccess.modifyDbStory(story,rundownStr);
                await cloneCache.modifyStory(rundownStr,story);
            }
        }
    }

    if(lineupList.length < cachedStories.length){
        deleteDif(lineupList,cachedStories,rundownStr);

    }
}
*/

