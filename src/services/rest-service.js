import { conn, activeLineup, lineupStore } from "./inews-service.js";
import lineupExists from "../utilities/lineup-validator.js";
import logger from "../utilities/logger.js";

// GET: localhost:3000/api/watcher
async function getInewsLineupFromStore(){ 
    logger(`External api command: set active watch to ${activeLineup} - succeed`);
    return lineupStore; 
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
    const valid = await lineupExists(lineupName);
    
    if(valid){
        logger(`External api command: set active watch to ${lineupName} - succeed`);
        lineupStore = {};
        lineupStore[lineupName] = [];
        activeLineup = lineupName;
        return `Done! Active watch status: ${activeLineup}`;
    } else {
        logger(`External api command: set active watch to ${lineupName} - failed: lineup n/a`);
        return `Error! Wrong lineup name "${lineupName}". Active watch status: ${activeLineup}`;
    }

}

export default {
    getInewsLineupFromStore,
    getAvailableLineups,
    setActiveLineup
}