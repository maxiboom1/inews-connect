import itemsHash from "../1-dal/items-hashmap.js";
import sqlService from "./sql-service.js";
import itemConstructor from "../utilities/item-constructor.js";

class DuplicatesService {
    constructor() {
    }

    async createDuplicate(item){
        item = itemConstructor(item);
        const itemId = await sqlService.saveDuplicateItem(item);
        itemsHash.addDuplicate(itemId, item);
        console.log("NEW DUPLICATE")
    }

}

const duplicateService = new DuplicatesService();

export default duplicateService;
