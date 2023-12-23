import conn from "../dal/inews-ftp.js"
import appConfig from "../utilities/app-config.js";
import hebDecoder from "../utilities/hebrew-decoder.js";
import lineupExists from "../utilities/lineup-validator.js";
import logger from "../utilities/logger.js";
import inewsCache from "../dal/inewsCache.js";
import sqlAccess from "./sql-service.js";

async function startMainProcess() { 
    console.log('Starting Inews-connect 1.5.0 ...');
    await sqlAccess.initialize();
    await rundownIterator();

}

async function rundownIterator() {
    console.time("Debug: Rundown Iteration process time:");
    const rundowns = await sqlAccess.getCachedRundowns();
    await sqlAccess.syncStoryCache(); // Fetch stories from db and store in cache
    
    for(const [rundownStr] of Object.entries(rundowns)){
        const valid = await lineupExists(rundownStr);
        if (valid) {
            await processLineup(rundownStr);
        } else {
            logger(`Error! Lineup "${rundownStr}" N/A`, true);
        }
    }

    setTimeout(rundownIterator, appConfig.pullInterval);
    console.timeEnd("Debug: Rundown Iteration process time:"); 
}

async function processLineup(rundownStr) {
    const lineupList = await conn.list(rundownStr); // Get lineup list from inews
    const cachedStories = await inewsCache.getStoryCache(rundownStr);
    for(let i = 0; i < lineupList.length; i++) {
        const story = lineupList[i];
        story.storyName = hebDecoder(lineupList[i].storyName);
        const cachedStory = cachedStories.find(item => item.identifier === lineupList[i].identifier); 
        // Create new story
        if(cachedStory === undefined){
            const expandedStoryData = await conn.story(rundownStr, story.fileName); // Get expanded story data from inews
            console.log(expandedStoryData.attachments);

            await sqlAccess.addDbStory(rundownStr, story, expandedStoryData, i);
        } else {
            const action = checkStory(story, cachedStory, i); // Compare inews version with cached
            if(action === "reorder"){
                // Reorder
                await sqlAccess.reorderDbStory(story, i, rundownStr);
            }else if(action === "modify"){
                // Modify
                await sqlAccess.modifyDbStory(story,rundownStr);
            }
        }
    }

    if(lineupList.length < cachedStories.length){
        deleteDif(lineupList,cachedStories,rundownStr);
    }
}

function checkStory(story, cache, index) {
    
    const reorder = story.fileType === "STORY" && (index != cache.ord);  

    if(reorder){return "reorder"};
    
    const modify = 
        story.fileType === "STORY" && 
        story.identifier === cache.identifier && (story.locator != cache.locator);

    if(modify){return "modify"};

    return false;
}

async function deleteDif(lineupList, cachedStories, rundownStr) {
    console.time("Debug: deleteDiff process time:");

    const identifiersSet = new Set(lineupList.map(story => story.identifier));
    cachedStories.forEach(async story => {
        if (!identifiersSet.has(story.identifier)) {
            await sqlAccess.deleteStory(story.uid, rundownStr);
        }
    });
    console.timeEnd("Debug: deleteDiff process time:");

}


export default {
    startMainProcess
};



