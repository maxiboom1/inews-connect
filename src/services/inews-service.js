import conn from "../dal/inews-ftp.js"
import appConfig from "../utilities/app-config.js";
import lineupStore from "../dal/local-store.js"
import hebDecoder from "../utilities/hebrew-decoder.js";
import lineupExists from "../utilities/lineup-validator.js";
import logger from "../utilities/logger.js";

async function startMainProcess() {
    lineupStore.initLineup();
    lineupsIterator();
}

async function lineupsIterator() {
    const valid = await lineupExists();
    if(valid){
        await processLineup(lineupStore.getActiveLineup()); 
    } else {
        logger(`Error! lineup "${lineupStore.getActiveLineup()}" N/A`, true); 
    } 
    setTimeout(lineupsIterator, appConfig.pullInterval);
}

async function processLineup(lineupName) {
    
    const lineupList = await conn.list(lineupName);
    const cachedLineup = lineupStore.getLineup(lineupName);
    for(let i = 0; i < lineupList.length; i++) {
        
        const decodedStoryName = hebDecoder(lineupList[i].storyName);
        const shouldUpdate = createCheckCondition(cachedLineup[i], lineupList[i], i);
        if (shouldUpdate) { 
            logger(`Updating story: ${decodedStoryName}`);  
            const story = await conn.story(lineupName, lineupList[i].fileName);
            const lineupInfo = createLineupInfo(decodedStoryName, i, lineupList, story);
            lineupStore.saveStory(lineupName, i, lineupInfo);
        }
        
        if (lineupList.length < cachedLineup.length) {  // Check if items have been deleted
            const deletedItems = cachedLineup.length - lineupList.length;
            cachedLineup.length = lineupList.length;
            logger(`INFO: ${deletedItems} Items has been deleted`);
        }
    } 
}

function createLineupInfo(decodedStoryName, i, lineupList, story){
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