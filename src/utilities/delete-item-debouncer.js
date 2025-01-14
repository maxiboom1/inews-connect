import sqlService from "../services/sql-service.js";
import itemsHash from "../1-dal/items-hashmap.js";
import logger from "./logger.js";

class DeleteItemDebouncer {
    constructor() {
        this.debouncerTimeouts = new Map(); // Store timeouts for each rundownStr + item combination
    }

    triggerDeleteItem(rundownStr, item) {
        // Validate inputs
        if (!rundownStr || typeof rundownStr !== 'string' || typeof item !== 'object') {
            console.error('Invalid inputs:', { rundownStr, item });
            return;
        }

        // Create a unique key based on rundownStr and serialized item
        const key = `${rundownStr}:${JSON.stringify(item)}`;
        // Update items hashmap
        itemsHash.remove(item.itemId);

        // Clear any existing timeout for this key
        if (this.debouncerTimeouts.has(key)) {
            clearTimeout(this.debouncerTimeouts.get(key));
        }

        // Set a new timeout for this key
        const timeout = setTimeout(() => {
            this.executeDelete(rundownStr, item);
        }, 8000); // 5 second debounce

        // Store the timeout in the map
        this.debouncerTimeouts.set(key, timeout);
    }

    async executeDelete(rundownStr, item) {
        const key = `${rundownStr}:${JSON.stringify(item)}`;

        try {
            if(!itemsHash.isUsed(item.itemId)){
                await sqlService.deleteItem(rundownStr, item);
            } else {
                logger(`Item ${item.itemId} revoked! Probably duo cut/paste.`)
            }
            
        } catch (error) {
            console.error('Error executing delete:', error);
        } finally {
            // Cleanup after operation
            this.debouncerTimeouts.delete(key);
        }
    }

    // Cleanup method for graceful shutdown
    cleanup() {
        for (const timeout of this.debouncerTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.debouncerTimeouts.clear();
    }
}

const deleteItemDebouncer = new DeleteItemDebouncer();

export default deleteItemDebouncer;
