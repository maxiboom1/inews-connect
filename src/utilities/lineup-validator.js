import conn from "../dal/inews-ftp.js"
import lineupStore from "../dal/local-store.js";

async function lineupExists(){
    const path = lineupStore.getActiveLineup();
    const dir = path.split(".").slice(0,-1).join(".");
    const lineupName = path.split(".").slice(-1).join(".").toUpperCase();
    const list = await conn.list(dir);

    for (const item of list) { 
        if (item.fileName === lineupName) {
            return true;
        } 
    }
    
    return false;
}

export default lineupExists;

