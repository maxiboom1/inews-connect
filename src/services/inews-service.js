import conn from "../dal/inews-ftp.js"
import appConfig from "../utilities/app-config.js";
import lineupStore from "../dal/local-store.js"
import hebDecoder from "../utilities/hebrew-decoder.js";
import lineupExists from "../utilities/lineup-validator.js";
import logger from "../utilities/logger.js";


async function startMainProcess() {
    
    const valid = await lineupExists();
    if(valid) {
        const activeLineup = lineupStore.getActiveLineup();
        lineupStore.initLineup(activeLineup);
        logger(`Default lineup ${activeLineup} is valid`);

    } else {
        logger(`Default lineup ${activeLineup} is invalid`);
    }
    logger(`Starting main process`);
    lineupsIterator();
}

async function lineupsIterator() {
    await processLineup(lineupStore.getActiveLineup()); 
    setTimeout(lineupsIterator, appConfig.pullInterval);
}

async function processLineup(lineupName) {
    if(lineupName === null){ 
        logger(`Error! "${appConfig.defaultLineup}" N/A`, true); 
        return; 
    }

    const lineupList = await conn.list(lineupName);
    const currentLineup = lineupStore.getLineup(lineupName);
    for(let i = 0; i < lineupList.length; i++) {
        
        const decodedStoryName = hebDecoder(lineupList[i].storyName);
        const shouldUpdate = createCheckCondition(currentLineup, lineupList, i, decodedStoryName);
        if (shouldUpdate) { 
            logger(`Updating story: ${decodedStoryName}`);  
            const story = await conn.story(lineupName, lineupList[i].fileName);
            const lineupInfo = createLineupInfo(decodedStoryName, i, lineupList, story);
            lineupStore.saveStory(lineupName, i, lineupInfo);
        }
        
        if (lineupList.length < currentLineup.length) {  // Check if items have been deleted
            const deletedItems = currentLineup.length - lineupList.length;
            currentLineup.length = lineupList.length;
            logger(`INFO: ${deletedItems} Items has been deleted`);
        }
    } 
}

function createLineupInfo(decodedStoryName, i, lineupList, story){
    return {
        storyName: decodedStoryName,
        index: i,
        modified: lineupList[i].modified,
        floated: lineupList[i].flags.floated,
        cues: story.cues,
        attachments: story.attachments,
        body: story.body,
        meta: story.meta,
        id: story.id
    };
}

function createCheckCondition(currentLineup, lineupList, i, decodedStoryName) {
    const result =
      lineupList[i].fileType === "STORY" && (
        !currentLineup[i] || // If this arr cell is undefined (usually in first gap)
        new Date(currentLineup[i].modified).getTime() !== new Date(lineupList[i].modified).getTime() || // If modified time are different
        currentLineup[i].storyName !== decodedStoryName || // if storyName are different
        currentLineup[i].index !== i // If index (position in lineup) are different
      );
    return result;
}

export default {
    startMainProcess
};

