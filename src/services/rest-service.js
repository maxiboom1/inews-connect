import conn from "../dal/inews-ftp.js";
import lineupStore from "../dal/local-store.js";
import lineupExists from "../utilities/lineup-validator.js";
import logger from "../utilities/logger.js";

// GET: localhost:3000/api/watcher
async function getInewsLineupFromStore(lineup){ 
    if(lineup === "active") return lineupStore.getLineup(); 
    logger(`External api command: Get ${lineupStore.getActiveLineup()} - succeed`);
    return lineupStore.getLineup(lineup); 
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
        lineupStore.setActiveLineup(lineupName);
        return `Done! Active watch status: ${lineupStore.getActiveLineup()}`;
}

export default {
    getInewsLineupFromStore,
    getAvailableLineups,
    setActiveLineup
}