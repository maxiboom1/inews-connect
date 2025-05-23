import processor from '../services/inews-service.js';
import sqlService from '../services/sql-service.js';
import logger from '../utilities/logger.js';

export async function handleTcpMessage(socket, cmd) {
    logger(`[TCP] Received: ${cmd}`, 'yellow');

    // Reset command
    if (cmd.startsWith('iNewsC-reset-')) {
        const uid = cmd.split('-')[2];
        const result = await processor.resetRundownByUid(uid, () => {
            socket.write(`iNewsC-reset-${uid}-OK\0`);
        });
        if (!result.ok) {
            socket.write(`iNewsC-reset-${uid}-${result.error}\0`);
        }


    // Load command
    } else if (cmd.startsWith('iNewsC-load-')) {
        const uid = cmd.split('-')[2];
        
        const result = processor.subscribeRundown(uid, () => {
            socket.write(`iNewsC-load-${uid}-OK\0`); // this passed as callback, and runs later
          });
        
        if (result.ok) {
            socket.__subscribedUid = uid; // store for disconnect cleanup
        } else {
            socket.write(`iNewsC-load-${uid}-${result.error}\0`);
        }
 
    // Unload command    
    } else if (cmd.startsWith('iNewsC-unload-')) {
        const uid = cmd.split('-')[2];
        const result = await processor.unsubscribeRundown(uid);
        
        if (result.ok) {
            socket.write(`iNewsC-unload-${uid}-OK\0`);
        } else {
            socket.write(`iNewsC-unload-${uid}-${result.error}\0`);
        } 
    // Item update 
    } else if(cmd.startsWith('iNewsC-itemUpdate-')){
        const uid = cmd.split('-')[2];
        itemUpdateFromNA(convertToArray(uid));
        socket.write(`iNewsC-itemUpdate-OK\0`);
    } 
    
    else {
        socket.write(`iNewsC-status-ERROR-Unknown command\0`);
    }
}

async function itemUpdateFromNA(itemsUidArr){
    for(const uid of itemsUidArr){
        const item = await sqlService.getItemByUid(uid);
        console.log(item);
        //Get this item from sql
    }
}

function convertToArray(itemsStr){
    return itemsStr.split(',').map(Number);
}