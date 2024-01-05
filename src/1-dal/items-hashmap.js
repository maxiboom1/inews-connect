class ItemsHashmap {
    constructor() {
        this.map = {}; 
    }

    add(gfxItem) {
        if (this.map[gfxItem]) {
            this.map[gfxItem] += 1;
        } else {
            this.map[gfxItem] = 1;
        }
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
        return this.get(gfxItem) > 0;
    }

    get(){
        return this.map;
    }
}

const itemsHash = new ItemsHashmap();

export default itemsHash;