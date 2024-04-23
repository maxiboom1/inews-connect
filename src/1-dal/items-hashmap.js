import fs from 'fs';
import path from 'path';

class ItemsHashmap {
    constructor() {
        this.map = {}; 
        this.unlinked = {};
        
        this.cacheFilePath = path.join(path.resolve(), 'unlinkedItemsCache.json');        
        this.loadUnlinkedFromCache();
        //setInterval(() => this.updateCacheFile(), 10 * 60 * 1000); // Update cache every 10 minutes
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

    add(gfxItem) {
        if (this.map[gfxItem]) {
            this.map[gfxItem] += 1;
        } else {
            this.map[gfxItem] = 1;
        }

        delete this.unlinked[gfxItem];
        
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
        return this.map[gfxItem] > 0;
    }

    get(){
        return this.unlinked;
    }

    addUnlinked(gfxItem){
        this.unlinked[gfxItem] = "";
    }

    
}

const itemsHash = new ItemsHashmap();

export default itemsHash;