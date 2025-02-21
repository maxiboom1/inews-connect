import fs from 'fs';
import path from 'path';
import sqlService from '../services/sql-service.js';
import logger from '../utilities/logger.js';

class ItemsHashmap {
    
    constructor() {
        this.items = {}; 
        this.duplicates = {}; // {itemId:{referenceItemId,rundownStr, storyIdentifier, storyId} ...}
        this.duplicatesFilePath = path.join(path.resolve(), 'duplicatesCache.json');            
        
        // Ensure cache files exist on load
        this.ensureCacheFileExists(this.duplicatesFilePath, {});
    }

    // Ensure the cache file exists or create it with default content
    ensureCacheFileExists(filePath, defaultContent) {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultContent), 'utf8');
        }
    }

    add(uuid) {
        this.items[uuid] = 1;
        return;
    }

    remove(uuid) {
        if (this.items[uuid]) {
            delete this.items[uuid];
        }
    }
    
    isUsed(uuid) {
        const result = this.items[uuid]>0;
        return result;
    }

    
}
    

const itemsHash = new ItemsHashmap();

export default itemsHash;