import conn from "../dal/inews-ftp.js"
import appConfig from "../utilities/app-config.js";
import lineupStore from "../dal/local-store.js"
import hebDecoder from "../utilities/hebrew-decoder.js";
import lineupExists from "../utilities/lineup-validator.js";
import logger from "../utilities/logger.js";

async function startMainProcess() { 
    await lineupStore.onLoadInit();
    lineupsIterator();
}

async function lineupsIterator() {
    //console.time('Process time for load inews rundowns'); // Start the timer
    
    for (let lineup of await lineupStore.getWatchedLineups()) {
        const valid = await lineupExists(lineup);
        if (valid) {
            await processLineup(lineup);
        } else {
            logger(`Error! Lineup "${lineup}" N/A`, true);
        }
    }

    //console.timeEnd('Process time for load inews rundowns'); // End the timer

    setTimeout(lineupsIterator, appConfig.pullInterval);
}

async function processLineup(lineupName) {
    const lineupList = await conn.list(lineupName); // Get lineup list from inews
    const cachedLineup = await lineupStore.getLineup(lineupName); // Get lineup cache from localStore
    
    for(let i = 0; i < lineupList.length; i++) {
        
        const decodedStoryName = hebDecoder(lineupList[i].storyName); // Decode story name
        const storyEvent = createCheckCondition(cachedLineup[i], lineupList[i]); // Compare inews version with cached
        
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
        //modified: lineupList[i].modified,//body: story.body,//meta: story.meta,//id: story.id//fileName:lineupList[i].fileName,//cues: story.cues,
    };
}

export default {
    startMainProcess
};



/*
async function processLineup(lineupName) {
    const lineupList = await conn.list(lineupName); // Get lineup list from inews
    const cachedLineup = await lineupStore.getLineup(lineupName); // Get lineup cache from localStore
    for(let i = 0; i < lineupList.length; i++) {
        
        const decodedStoryName = hebDecoder(lineupList[i].storyName); // Decode story name
        const shouldUpdate = createCheckCondition(cachedLineup[i], lineupList[i]); // Compare inews version with cached
        if (shouldUpdate) { 
            logger(`Update event:${lineupName}, story: ${decodedStoryName}`);  
            const story = await conn.story(lineupName, lineupList[i].fileName); // Get expanded story data from inews
            const storyInfo = createStoryInfo(decodedStoryName, i, lineupList, story); // Create story obj
            await lineupStore.saveStory(lineupName, i, storyInfo);
        }
    }
    
    if (lineupList.length < cachedLineup.length) {  // Check if items have been deleted
        const deletedItems = cachedLineup.length - lineupList.length;
        await lineupStore.deleteBasedLength(lineupName,deletedItems);
        logger(`Delete event:${lineupName}: ${deletedItems} Items has been deleted`);
    }
    
}

function createCheckCondition(cachedStory, lineupStory) {
    
    const result = 
        lineupStory.fileType === "STORY" && (
        !cachedStory || 
        cachedStory.locator != lineupStory.locator
        );
   
        return result;

}
*/