import fs from 'fs';
import path from 'path';

class ItemsHashmap {
    constructor() {
        this.map = {}; 
        this.unlinked = {};
        this.duplicates = {};
        this.cacheFilePath = path.join(path.resolve(), 'unlinkedItemsCache.json');        
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

}

const itemsHash = new ItemsHashmap();

export default itemsHash;