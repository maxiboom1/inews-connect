import fs from 'fs';
import path from 'path';
import sqlService from '../services/sql-service.js';
import logger from '../utilities/logger.js';

class ItemsHashmap {
    
    constructor() {
        this.map = {}; 
        this.unlinked = {};
        this.duplicates = {}; // {itemId:{referenceItemId,rundownStr, storyIdentifier, storyId} ...}
        this.cacheFilePath = path.join(path.resolve(), 'unlinkedItemsCache.json');
        this.duplicatesFilePath = path.join(path.resolve(), 'duplicatesCache.json');            
        
        // Ensure cache files exist on load
        this.ensureCacheFileExists(this.cacheFilePath, {});
        this.ensureCacheFileExists(this.duplicatesFilePath, {});
        
        this.loadUnlinkedFromCache();
        setInterval(() => this.updateCacheFile(), 60000); 
    }

    // Ensure the cache file exists or create it with default content
    ensureCacheFileExists(filePath, defaultContent) {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultContent), 'utf8');
        }
    }

    loadUnlinkedFromCache() {
        try {
            const data = fs.readFileSync(this.cacheFilePath, 'utf8');
            this.unlinked = JSON.parse(data);
        } catch (err) {
            console.error('Error reading from cache file:', err);
            this.unlinked = {};
        }
    }

    updateCacheFile() {
        try {
            const data = JSON.stringify(this.unlinked);
            fs.writeFileSync(this.cacheFilePath, data, 'utf8');
        } catch (err) {
            console.error('Error writing to cache file:', err);
        }
    }

    async add(gfxItem) {
        this.map[gfxItem] = 1;
        delete this.unlinked[gfxItem];
        return;
    }

    remove(gfxItem) {
        if (this.map[gfxItem]) {
            delete this.map[gfxItem];
        }
    }

    getHashData(gfxItem){
        return this.map[gfxItem];
    }
    
    isUsed(gfxItem) {
        const result = this.map[gfxItem]>0;
        return result;
    }

    get(){
        return this.unlinked;
    }

    addUnlinked(gfxItem){
        this.unlinked[gfxItem] = "";
    }

    /* - - - - - - - - - - DUPLICATES - - - - - - - - - - */

    async addDuplicate(referenceItemId, itemId, rundownStr, storyIdentifier, storyId, storyFileName) {
        this.duplicates[itemId] = { rundownStr, storyIdentifier, referenceItemId, storyId, storyFileName};
        await this.updateDuplicatesCache();
    }

    async updateDuplicatesCache(){
        try {
            const data = JSON.stringify(this.duplicates);
            fs.writeFileSync(this.duplicatesFilePath, data, 'utf8');
        } catch (err) {
            console.error('Error writing to duplicates cache file:', err);
        }
    }

    async resetDuplicates(){
        
        // Read cache on load
        const cachedDuplicates = fs.readFileSync(this.duplicatesFilePath, 'utf8');

        const duplicatesToDelete = Object.entries(JSON.parse(cachedDuplicates));

        for (const [key, value] of duplicatesToDelete) {
            const item = {
                itemId: key, 
                storyId:value.storyId
            }
            if(key === "null"){
                logger(`[ITEM] Duplicate cache has invalid data, skipping..`,"red");
                continue;
            }
            await sqlService.deleteItem(value.rundownStr, item);
          }
        // Clear cache file on load
        fs.writeFileSync(this.duplicatesFilePath, JSON.stringify(this.duplicates), 'utf8');
    }

    isDuplicate(itemId){
        if(this.duplicates[itemId]) return true;
        return false;
    }
    
    hasDuplicates(itemId) {
        return Object.values(this.duplicates).some(duplicate => duplicate.referenceItemId === itemId);
    }

    getReferenceItem(itemId) {
        if(this.duplicates[itemId]){
            return this.duplicates[itemId].referenceItemId;
        }
        return null;
        
    }

    async deleteDuplicate(itemId){
        if(this.duplicates[itemId] === undefined) return;
        delete this.duplicates[itemId];
        await this.updateDuplicatesCache();
    }

    getDuplicatesByReference(referenceItemId) {
        const duplicatesObj = {};
        
        for (const [itemId, props] of Object.entries(this.duplicates)) {
            if (props.referenceItemId === referenceItemId) {
                duplicatesObj[itemId] = props; // Store the props with itemId as the key
            }
        }
    
        // Return null if the object is empty
        return Object.keys(duplicatesObj).length === 0 ? null : duplicatesObj;
    }
    
    // Not used in branch anymore
    getDuplicatesStoryFileNames(referenceItemId) {
        return [
            ...new Set(
                Object.values(this.duplicates)
                    .filter(duplicate => duplicate.referenceItemId === referenceItemId)
                    .map(duplicate => duplicate.storyFileName)
            )
        ];
    }
    
    // Returns {identifier:rundownStr} pairs 
    getDuplicateStoryIdentifiers(referenceItemId) {
        const uniquePairs = {};
    
        Object.values(this.duplicates)
            .filter(duplicate => duplicate.referenceItemId === referenceItemId)
            .forEach(duplicate => {
                uniquePairs[duplicate.storyIdentifier] = duplicate.rundownStr;
            });
        return uniquePairs;
    }

    getData(){
        return this.map;
    }
    
}
    

const itemsHash = new ItemsHashmap();

export default itemsHash;