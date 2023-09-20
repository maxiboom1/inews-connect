import Inews from '../inews-plugin/InewsClient.js';
import hebDecoder from "../utilities/hebrew-decoder.js";
import lineupExists from "../utilities/lineup-validator.js";
import logger from "../utilities/logger.js";

// Globals
export let conn = {};
export let lineupStore = {};
export let activeLineup = "";
let configData = {};

async function startMainProcess(config) {
    logger("Inews connect 1.0.2");
    // Copy config data to the global variable
    configData = { ...config };
    
    // Create Inews object
    conn = new Inews({ ...config.conn });
    logger("Loaded config.json successfully");

    const valid = await lineupExists(configData.defaultLineup);
    if(valid) {
        activeLineup = configData.defaultLineup;
        lineupStore[activeLineup] = [];
        logger(`Default lineup ${activeLineup} is valid`);

    } else {
        logger(`Default lineup ${activeLineup} is invalid`);
        activeLineup = null;
    }
    logger(`Starting main process`);
    // Start main application process
    lineupsIterator();
}

async function lineupsIterator(loopCounter = 1) {
    
    console.time(`INFO: ${loopCounter} cycle! Lineup ${activeLineup} Processing`);

    await processLineup(activeLineup);

    console.timeEnd(`INFO: ${loopCounter} cycle! Lineup ${activeLineup} Processing`);

    logger("-------------------");
    
    setTimeout(()=>{lineupsIterator(++loopCounter);}, configData.pullInterval);
    
}

async function processLineup(lineupName) {
    if(lineupName === null){ 
        logger(`Error! Wrong lineup name "${configData.defaultLineup}"\nCheck defaultLineup setting in config.json`, true);
        return;
        }
    const lineupList = await conn.list(lineupName);
    
    for(let i = 0; i < lineupList.length; i++) {
        const decodedStoryName = hebDecoder(lineupList[i].storyName);
        const shouldUpdate = createCheckCondition(lineupName, lineupList, i, decodedStoryName);
        if (shouldUpdate) { 
            logger(`Updating story: ${decodedStoryName}`);  
            const story = await conn.story(lineupName, lineupList[i].fileName);
            const lineupInfo = createLineupInfo(decodedStoryName, i, lineupList, story);
            
            // Update the lineupStore with the new lineupInfo
            lineupStore[lineupName][i] = { ...lineupInfo };
        }

        // Check if items have been deleted
        if (lineupList.length < lineupStore[lineupName].length) {
            const deletedItems = lineupStore[lineupName].length - lineupList.length;
            lineupStore[lineupName].length = lineupList.length;
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

function createCheckCondition(lineupName, lineupList, i, decodedStoryName) {
    const result =
      lineupList[i].fileType === "STORY" && (
        !lineupStore[lineupName][i] || // If this arr cell is undefined (usually in first gap)
        new Date(lineupStore[lineupName][i].modified).getTime() !== new Date(lineupList[i].modified).getTime() || // If modified time are different
        lineupStore[lineupName][i].storyName !== decodedStoryName || // if storyName are different
        lineupStore[lineupName][i].index !== i // If index (position in lineup) are different
      );
    return result;
}

export default {
    startMainProcess
};

