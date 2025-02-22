import ItemModel from "../2-models/item-model.js";
  
function itemConstructor(item = {}) {
    const newItem = {};

    for (const key in ItemModel) {
        const modelType = typeof ItemModel[key];
        const itemValue = item[key];

        // Convert type according to model
        if (itemValue !== undefined) {
            if (modelType === "number") {
                newItem[key] = Number(itemValue) || 0;
            } else if (modelType === "string") {
                newItem[key] = String(itemValue);
            } else {
                newItem[key] = itemValue;
            }
        } else {
            // Use model default if property is missing
            newItem[key] = ItemModel[key];
        }
    }

    return newItem;
}
  
  export default itemConstructor;