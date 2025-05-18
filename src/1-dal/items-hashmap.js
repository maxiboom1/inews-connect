import fs from 'fs';
import path from 'path';
import sqlService from '../services/sql-service.js';
import logger from '../utilities/logger.js';
import inewsCache from './inews-cache.js';

class ItemsHashmap {
    
    constructor() {
        this.map = {}; 
        this.duplicates = {}; // {itemId:{referenceItemId,rundownStr, storyIdentifier, storyId} ...}
        this.duplicatesFilePath = path.join(path.resolve(), 'duplicatesCache.json');            
        this.ensureCacheFileExists(this.duplicatesFilePath, {});
    }

    ensureCacheFileExists(filePath, defaultContent) {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultContent), 'utf8');
        }
    }

    async add(gfxItem) {
        this.map[gfxItem] = 1;
        return;
    }

    remove(gfxItem) {
        if (this.map[gfxItem]) {
            delete this.map[gfxItem];
        }
    }
    
    isUsed(gfxItem) {
        const result = this.map[gfxItem]>0;
        return result;
    }

    async clearHashForRundown(rundownStr) {
        const rundown = await inewsCache.getRundown(rundownStr);
        if (!rundown) return;
    
        for (const [identifier, story] of Object.entries(rundown)) {
            if (!story.attachments) continue;
    
            for (const gfxId of Object.keys(story.attachments)) {
                itemsHash.remove(gfxId);
                this.deleteDuplicate(gfxId);
            }
        }
    
        logger(`[HASH] Cleared item hash for rundown "${rundownStr}"`);
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