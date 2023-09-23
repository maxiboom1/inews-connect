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
    const currentLineup = lineupStore.getLineup(lineupName);
    for(let i = 0; i < lineupList.length; i++) {
        
        // THE KEY FOR TROUBLE - WATCH LOCATOR !!!
        console.log(lineupList[i].locator);
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






async function test(inewsQueue){
   
    conn.list(inewsQueue)
        .then(listItems => {
            listItems.forEach((listItem) => {
                if(listItem.fileType === 'STORY') {
                    conn.story(inewsQueue, listItem.fileName)
                        .then(story => {
                            //console.log(conn._test(listItem.fileName));
                            
                            if(conn.load === 0){
                                //console.log("Finished");
                                
                                setTimeout(lineupsIterator, 5000)
                            
                            }
                            
                        })
                        .catch(error => {
                            console.error("ERROR", error);
                        });
                }
            });
        });    

}
