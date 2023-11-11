import conn from "../dal/inews-ftp.js"
import appConfig from "../utilities/app-config.js";
import lineupStore from "../dal/local-store.js"
import hebDecoder from "../utilities/hebrew-decoder.js";
import lineupExists from "../utilities/lineup-validator.js";
import logger from "../utilities/logger.js";
import db from "../dal/sql.js";

async function startMainProcess() {
    await lineupStore.initLineup();
    lineupsIterator();
}

async function lineupsIterator() {
    const valid = await lineupExists();//Check if lineup exists
    if(valid){
        await processLineup(await lineupStore.getActiveLineup()); 
    } else {
        logger(`Error! lineup "${await lineupStore.getActiveLineup()}" N/A`, true); 
    } 
    setTimeout(lineupsIterator, appConfig.pullInterval);
}

async function processLineup(lineupName) {
    
    const lineupList = await conn.list(lineupName); // Get lineup list from inews
    const cachedLineup = await lineupStore.getLineup(lineupName); // Get lineup cache from localStore
    for(let i = 0; i < lineupList.length; i++) {
        
        const decodedStoryName = hebDecoder(lineupList[i].storyName); // Decode story name
        const shouldUpdate = createCheckCondition(cachedLineup[i], lineupList[i]); // Compare inews version with cached
        if (shouldUpdate) { 
            logger(`Updating story: ${decodedStoryName}`);  
            const story = await conn.story(lineupName, lineupList[i].fileName); // Get expanded story data from inews
            const storyInfo = createStoryInfo(decodedStoryName, i, lineupList, story); // Create story obj
            await lineupStore.saveStory(lineupName, i, storyInfo);
        }
        
        if (lineupList.length < cachedLineup.length) {  // Check if items have been deleted
            const deletedItems = cachedLineup.length - lineupList.length;
            // Work here
            await lineupStore.deleteBasedLength(lineupName,deletedItems);
            //cachedLineup.length = lineupList.length;
            logger(`INFO: ${deletedItems} Items has been deleted`);
        }
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