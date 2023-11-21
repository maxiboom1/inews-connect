import conn from "../dal/inews-ftp.js"
import appConfig from "../utilities/app-config.js";
import lineupStore from "../dal/local-store.js"
import hebDecoder from "../utilities/hebrew-decoder.js";
import lineupExists from "../utilities/lineup-validator.js";
import logger from "../utilities/logger.js";

async function startMainProcess() {
    
    // Create and reset DB && LS with lineups arr from config.json
    await lineupStore.onLoadInit();
    lineupsIterator(true);
}

async function lineupsIterator(firstLoad) {
    
    for(let lineup of await lineupStore.getWatchedLineups()){
        const valid = await lineupExists(lineup);//Check if lineup exists
        if(valid){
            await processLineup(lineup,firstLoad); 
        } else {
            logger(`Error! lineup "${lineup}" N/A`, true); 
        } 
    }
    
    setTimeout(lineupsIterator, appConfig.pullInterval);
}

async function processLineup(lineupName, firstLoad = undefined) {
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
        // Work here
        await lineupStore.deleteBasedLength(lineupName,deletedItems);
        logger(`Delete event:${lineupName}: ${deletedItems} Items has been deleted`);
    }
    
    if(firstLoad){
        console.log("SQL DB synced ☑");
        await lineupStore.deleteBasedLength(lineupName,lineupList.length);
    } 

}

function createStoryInfo(decodedStoryName, i, lineupList, story){
    return {
        storyName: decodedStoryName,
        index: i,
        fileName:lineupList[i].fileName,
        locator: lineupList[i].locator,
        modified: lineupList[i].modified,
        floated: lineupList[i].flags.floated,
        cues: story.cues,
        attachments: story.attachments,
        body: story.body,
        meta: story.meta,
        id: story.id
    };
}

function createCheckCondition(cachedStory, lineupStory) {
    
    const result = 
        lineupStory.fileType === "STORY" && (
        !cachedStory || 
        cachedStory.locator != lineupStory.locator
        );
   
        return result;

}

export default {
    startMainProcess
};


