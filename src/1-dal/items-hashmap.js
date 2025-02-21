class ItemsHashmap {
    
    constructor() {
        this.items = {}; 
        this.duplicates = {};
    }

    add(uuid) {
        this.items[String(uuid)] = 1;
        return;
    }

    remove(uuid) {
        if (this.items[String(uuid)]) {
            delete this.items[String(uuid)];
        }
    }
    
    isUsed(uuid) {
        const result = this.items[String(uuid)]>0;
        return result;
    }

    addDuplicate(itemId, item) {
        this.duplicates[Number(itemId)] = {};
        this.duplicates[Number(itemId)] = { 
            story: Number(item.story), 
            rundown: Number(item.rundown),
            uuid: String(item.uuid),
            ord: Number(item.ord)
        };
    }

    removeDuplicate(itemId) {
        delete this.duplicates[Number(itemId)]; 
    }
 
    hasDuplicates(uuid) {
        return Object.values(this.duplicates).some(duplicate => duplicate.uuid === uuid);
    }

    getDuplicateId(story, rundown) {
        for (const [itemId, duplicate] of Object.entries(this.duplicates)) {
            if (duplicate.story === Number(story) && duplicate.rundown === Number(rundown)) {
                return itemId;
            }
        }
        return null; // Return null if no match is found
    }

}
    

const itemsHash = new ItemsHashmap();

export default itemsHash;