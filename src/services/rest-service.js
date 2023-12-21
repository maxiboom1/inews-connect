import conn from "../dal/inews-ftp.js";
import logger from "../utilities/logger.js";

export default {

}




/*
// GET: localhost:3000/api/watcher
async function getInewsLineupFromStore(lineup){ 
    let result;
    
    if(lineup === "active") {
        result = await lineupStore.getLineup();
    } else {
        result = await lineupStore.getLineup(lineup);
    }
    
    logger(`External api command: Get ${await lineupStore.getActiveLineup()} - succeed`);
    
    return result; 
}

// GET: localhost:3000/api/services/get-dir/:dirName
async function getAvailableLineups(path){
    logger(`External api command: Get Directory list for "${path}"`);
    const folderList = await conn.list(path.toLowerCase());
    const folderData = [];
    for(const dir of folderList){
        folderData.push({Type:dir.fileType, Name:dir.fileName})
    }

    return folderData;
}

// POST: localhost:3000/api/services/set-watcher/show.alex.test1
async function setActiveLineup(lineupName){
        logger(`External api command: set active watch to ${lineupName} - succeed`);
        await lineupStore.setActiveLineup(lineupName);
        return `Done! Active watch status: ${await lineupStore.getActiveLineup()}`;
}
*/