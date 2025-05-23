import processor from '../services/inews-service.js';
import logger from '../utilities/logger.js';

export async function handleTcpMessage(socket, cmd) {
    //logger(`[TCP] Received: ${cmd}`, 'yellow');

    // Reset command
    if (cmd.startsWith('iNewsC-reset-')) {
        const uid = cmd.split('-')[2];
        processor.setReset(uid, (response = `iNewsC-reset-${uid}-OK\0`) => {
            socket.write(response);
        });
    
    } else if(cmd.startsWith('iNewsC-itemUpdate-')){
        const uid = cmd.split('-')[2];
        itemUpdateFromNA(convertToArray(uid));
        socket.write(`iNewsC-itemUpdate-OK\0`);
    } 
    
    else {
        socket.write(`iNewsC-status-Protocol deprecated\0`);
    }
}

async function itemUpdateFromNA(itemsUidArr){
    for(const uid of itemsUidArr){
        //const item = await sqlService.getItemByUid(uid);
        //console.log(itemsHash.isDuplicate());
    }
}

function convertToArray(itemsStr){
    return itemsStr.split(',').map(Number);
}