import fs from 'fs';
import path from 'path';
import sqlService from '../services/sql-service.js';

class ItemsHashmap {
    
    constructor() {
        this.map = {}; 
        this.unlinked = {};
        this.duplicates = {}; // {itemId:referenceItemId, ...}
        this.cacheFilePath = path.join(path.resolve(), 'unlinkedItemsCache.json');
        this.duplicatesFilePath = path.join(path.resolve(), 'duplicatesCache.json');            
        this.loadUnlinkedFromCache();
        setInterval(() => this.updateCacheFile(), 60000); 
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
        if (this.map[gfxItem]) {
            this.map[gfxItem] += 1;
        } else {
            this.map[gfxItem] = 1;
        }
        //console.log('Updated gfx item in item hash: ',this.map[gfxItem], "here is the isused result: ", this.isUsed(gfxItem));
        delete this.unlinked[gfxItem];
        return;
    }

    remove(gfxItem) {
        if (this.map[gfxItem]) {
            this.map[gfxItem] -= 1;
            if (this.map[gfxItem] === 0) {
                delete this.map[gfxItem];
            }
        }
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

    async addDuplicate(referenceItemId, itemId){
        this.duplicates[itemId]  = referenceItemId;
        await this.updateDuplicatesCache();
    }

    async deleteDuplicate(itemId){
        delete this.duplicates[itemId];
        this.updateDuplicatesCache();
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
        // Get duplicates array from cache
        const duplicatesToDelete = Object.keys(JSON.parse(cachedDuplicates));
        // Delete duplicates from DB
        duplicatesToDelete.forEach(async itemId => await sqlService.deleteItemById(itemId));
        // Clear cache file on load
        fs.writeFileSync(this.duplicatesFilePath, JSON.stringify(this.duplicates), 'utf8');
    }

    isDuplicate(itemId){
        ///...
    }
}

const itemsHash = new ItemsHashmap();

export default itemsHash;