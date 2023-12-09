import conn from "../dal/inews-ftp.js"
import appConfig from "../utilities/app-config.js";
import hebDecoder from "../utilities/hebrew-decoder.js";
import lineupExists from "../utilities/lineup-validator.js";
import logger from "../utilities/logger.js";
import storyCache from "../dal/storiesCache.js";
import sqlAccess from "./sql-service.js";

async function startMainProcess() { 
    await sqlAccess.initialize();
    await lineupsIterator();
}

async function lineupsIterator() {

    const rundowns = await sqlAccess.getCachedRundowns();
    await storyCache.syncStoryCache(); // Fetch stories from db and store in cache
    
    for(const [rundownStr] of Object.entries(rundowns)){
        const valid = await lineupExists(rundownStr);
        if (valid) {
            await processLineup(rundownStr);
        } else {
            logger(`Error! Lineup "${lineup}" N/A`, true);
        }
    }

    setTimeout(lineupsIterator, appConfig.pullInterval);
}

async function processLineup(rundownStr) {
    const lineupList = await conn.list(rundownStr); // Get lineup list from inews
    const cachedStories = await storyCache.getStroyCache();
    for(let i = 0; i < lineupList.length; i++) {
        //const decodedStoryName = hebDecoder(lineupList[i].storyName); // Decode story name
        const story = lineupList[i];
        const cachedStory = cachedStories.find(item => item.identifier === lineupList[i].identifier); 
        
        // Create new story
        if(cachedStory === undefined){
            const expandedStoryData = await conn.story(rundownStr, story.fileName); // Get expanded story data from inews
            await sqlAccess.addDbStory(rundownStr, story, expandedStoryData, i);
        } else {
            const action = checkStory(story, cachedStory, i); // Compare inews version with cached
            if(action === "reorder"){
                await sqlAccess.reorderDbStory(story, i);
            }
            console.log(action);
        }


    }
/*
        const storyEvent = checkStory(story, cachedStory); // Compare inews version with cached
        
        if (storyEvent === "modify") { 
            //logger(`Story modify event:${lineupName}, story: ${decodedStoryName}`);  
            const story = await conn.story(lineupName, lineupList[i].fileName); // Get expanded story data from inews
            const storyInfo = createStoryInfo(decodedStoryName, i, lineupList, story); // Create story obj
            await lineupStore.createOrModifyStory(lineupName, i, storyInfo);
        }

        if (storyEvent === "reorder") { 
            //logger(`Story reorder event:${lineupName}, story: ${decodedStoryName}`);
            const story = await conn.story(lineupName, lineupList[i].fileName); // Get expanded story data from inews
            const storyInfo = createStoryInfo(decodedStoryName, i, lineupList, story); // Create story obj
            await lineupStore.setNewStoryIndex(lineupName,storyInfo, i);

        }
    }
    
    if (lineupList.length < cachedLineup.length) {  // Check if items have been deleted
        const deletedItems = cachedLineup.length - lineupList.length;
        await lineupStore.deleteBasedLength(lineupName,deletedItems);
        logger(`Delete event:${lineupName}: ${deletedItems} Items has been deleted`);
    }
   */ 
}

function checkStory(story, cache, index) {
    
    const reorder = story.fileType === "STORY" && (index != cache.ord);  

    if(reorder){return "reorder"};
    
    const modify = 
        story.fileType === "STORY" && 
        story.identifier === cache.identifier &&
        (story.locator != cache.locator);

    if(modify){return "modify"};

    return false;
}

function createCheckCondition(cachedStory, lineupStory) {

    const reorder = 
        lineupStory.fileType === "STORY" && (
        !cachedStory || 
        cachedStory.identifier != lineupStory.identifier
    );  

    if(reorder){return "reorder"};
    
    const modify = 
        lineupStory.fileType === "STORY" && 
        cachedStory.identifier === lineupStory.identifier &&
        (!cachedStory || cachedStory.locator != lineupStory.locator);

    if(modify){return "modify"};

    return false;
}

function createStoryInfo(decodedStoryName, i, lineupList, story){
    return {
        storyName: decodedStoryName,
        index: i,
        locator: lineupList[i].locator,
        identifier: lineupList[i].identifier,
        floated: lineupList[i].flags.floated,
        attachments: story.attachments,
    };
}

export default {
    startMainProcess
};



