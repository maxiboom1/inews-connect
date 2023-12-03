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
    console.time('Process time for load inews rundowns'); // Start the timer
    
    for (let lineup of await lineupStore.getWatchedLineups()) {
        const valid = await lineupExists(lineup);
        if (valid) {
            await processLineup(lineup);
        } else {
            logger(`Error! Lineup "${lineup}" N/A`, true);
        }
    }

    console.timeEnd('Process time for load inews rundowns'); // End the timer

    setTimeout(lineupsIterator, appConfig.pullInterval);
}



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



/*
async function test(rundownName) {
    console.log('Testing lineup:', rundownName);
    let storyPromises = [];

    let inewsQueue = rundownName;

    try {
        const listItems = await conn.list(inewsQueue);

        listItems.forEach((listItem) => {
            if (listItem.fileType === 'STORY') {
                let storyPromise = conn.story(inewsQueue, listItem.fileName);

                storyPromises.push(storyPromise);

                storyPromise
                    .then(story => {
                    })
                    .catch(error => {
                        console.error('ERROR', error);
                    });
            }
        });

        // Return a promise that resolves when all story promises are settled
        return Promise.all(storyPromises).then(() => {
            console.log('Promise done for lineup:', rundownName);
        });

    } catch (error) {
        console.error('Error fetching list items:', error);
    }
}


conn.on('connections', connections => {
    console.log(connections + ' connections active');
});
conn.on('queued', queued => {
    console.log(queued + ' queued requests');
});
    
conn.on('running', running => {
    console.log(running + ' running requests');
});

*/
