import sqlService from "../services/sql-service.js";
import itemsHash from "../1-dal/items-hashmap.js";
import logger from "./logger.js";
import itemsService from "../services/items-service.js";
import processor from "../services/inews-service.js";
import appConfig from "./app-config.js";

class DeleteItemDebouncer {
    
    constructor() {
        this.debouncerTimeouts = new Map(); // Store timeouts for each rundownStr + item combination
        this.cutItemTimeout = appConfig.cutItemTimeout;
    }

    async triggerDeleteItem(rundownStr, item) {  //Item: {itemId, rundownId, storyId}
        
        // If the item is duplicate - delete it and exit the process.
        if(itemsHash.isDuplicate(item.itemId)){
            await sqlService.deleteItem(rundownStr, item); 
            return; 
        }
        let duplicateFileNames = [];
        
        // If this item has duplicates - delete all of them.
        if(itemsHash.hasDuplicates(item.itemId)){
            // collect all duplicates storyIdentifiers
            duplicateFileNames =itemsHash.getDuplicatesStoryFileNames(item.itemId);
            await itemsService.clearAllDuplicates(item.itemId);
        }
        
        // Create a unique key based on rundownStr and serialized item
        const key = `${rundownStr}:${JSON.stringify(item)}`;

        // Set disabled
        await sqlService.disableItem(rundownStr, item);
        
        // Remove from hash
        itemsHash.remove(item.itemId);

        // Clear any existing timeout for this key
        if (this.debouncerTimeouts.has(key)) {
            clearTimeout(this.debouncerTimeouts.get(key));
        }

        // Set a new timeout for this key
        const timeout = setTimeout(() => {
            this.executeDelete(rundownStr, item, duplicateFileNames);
        }, this.cutItemTimeout); 

        // Store the timeout in the map
        this.debouncerTimeouts.set(key, timeout);
        
    }

    async executeDelete(rundownStr, item, duplicateFileNames) {
        
        if(itemsHash.isUsed(item.itemId)) {
            logger(`Item ${item.itemId} revoked! Probably duo cut/paste.`);
            if(duplicateFileNames.length > 0){
                logger(`Item ${item.itemId} has duplicates. Re-sync triggered`);
                processor.setSyncStoryFileNames(duplicateFileNames);
            }    
            return;
        }

        const key = `${rundownStr}:${JSON.stringify(item)}`;

        try {
            await sqlService.deleteItem(rundownStr, item);  
        } catch (error) {
            console.error('Error executing delete:', error);
        } finally {
            // Cleanup after operation
            this.debouncerTimeouts.delete(key);
        }
    }

}

const deleteItemDebouncer = new DeleteItemDebouncer();

export default deleteItemDebouncer;
