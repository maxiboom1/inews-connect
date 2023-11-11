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
    const valid = await lineupExists();
    if(valid){
        await processLineup(await lineupStore.getActiveLineup()); 
    } else {
        logger(`Error! lineup "${await lineupStore.getActiveLineup()}" N/A`, true); 
    } 
    setTimeout(lineupsIterator, appConfig.pullInterval);
}

async function processLineup(lineupName) {
    
    const lineupList = await conn.list(lineupName);
    const cachedLineup = await lineupStore.getLineup(lineupName);
    for(let i = 0; i < lineupList.length; i++) {
        
        const decodedStoryName = hebDecoder(lineupList[i].storyName);
        const shouldUpdate = createCheckCondition(cachedLineup[i], lineupList[i], i);
        if (shouldUpdate) { 
            logger(`Updating story: ${decodedStoryName}`);  
            const story = await conn.story(lineupName, lineupList[i].fileName);
            const lineupInfo = createLineupInfo(decodedStoryName, i, lineupList, story);
            await lineupStore.saveStory(lineupName, i, lineupInfo);
            await addItemToDatabase(lineupInfo);
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


async function addItemToDatabase(storyData) {
    try {
        const sql = `
            INSERT INTO current_lineup 
            (storyName, storyIndex, fileName, locator, modified, floated, cues, attachments, body, meta, storyId) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            storyName = VALUES(storyName),
            storyIndex = VALUES(storyIndex),
            fileName = VALUES(fileName),
            locator = VALUES(locator),
            modified = VALUES(modified),
            floated = VALUES(floated),
            cues = VALUES(cues),
            attachments = VALUES(attachments),
            body = VALUES(body),
            meta = VALUES(meta),
            storyId = VALUES(storyId)
        `;

        const values = [
            storyData.storyName,
            storyData.index,
            storyData.fileName,
            storyData.locator,
            storyData.modified,
            storyData.floated,
            JSON.stringify(storyData.cues),
            JSON.stringify(storyData.attachments),
            storyData.body,
            JSON.stringify(storyData.meta),
            storyData.id
        ];

        const result = await db.execute(sql, values);

        console.log('Item added/updated in the database!');
        return result;
    } catch (error) {
        console.error('Error adding/updating item:', error);
        throw error;
    }
}

async function resetDB(){
    try {
        const sql = `DELETE FROM current_lineup`;
        const result = await db.execute(sql);
        console.log('DB cleaned!');
        return result;
    } catch (error) {
        console.error('Error adding item:', error);
        throw error;
    }
}

export default {
    startMainProcess
};