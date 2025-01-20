import express from "express";
import sqlService from "../services/sql-service.js";
import inewsCache from "../1-dal/inews-cache.js";
import itemsService from "../services/items-service.js";
import itemsHash from "../1-dal/items-hashmap.js";
import appConfig from "../utilities/app-config.js";
const router = express.Router();

const showDuplicatesStatus = appConfig.showDuplicatesStatus;

// Get http://serverAddr:4001/api/productions
router.get('/productions', async (req, res) => {
  const productions = await inewsCache.getProductionsArr();
  res.json(productions);
});

// Get http://serverAddr:4001/api/templates
router.get('/templates/:uid', async (req, res) => {
  const productionUid = req.params.uid;
  const templates = await inewsCache.getTemplatesByProduction(productionUid);
  res.json(templates);
});

// Get http://serverAddr:4001/api/get-item-data
router.get('/get-item-data/:uid', async (req, res) => {
  const itemUid = req.params.uid;
  const itemData = await sqlService.getItemData(itemUid);
  
  // If item has duplicates, fetch and set hasDuplicate,rundown, story to itemData 
  if(itemsHash.hasDuplicates(itemUid) && showDuplicatesStatus){
    const meta = await inewsCache.getRundownStrAndStoryName(itemData.rundown, itemData.story);
    itemData.hasDuplicate = true;
    itemData.rundown = meta.rundown;
    itemData.story = meta.storyName;
  } else {
    itemData.hasDuplicate = false;
  }
  res.json(itemData);
});

// Post http://serverAddr:4001/api/set-item
router.post('/set-item', async (req, res) => {
  try {
      const item = req.body;
      const templateUid = await sqlService.storeNewItem(item);
      res.json(templateUid);
  } catch (error) {
      console.error('Error processing JSON data:', error);
      res.status(400).json("Error processing JSON data");
  }
});

// Post http://serverAddr:4001/api/update-item
router.post('/update-item', async (req, res) => {
  try {
      const item = req.body;
      await sqlService.updateItemFromFront(item);
      await itemsService.itemProcessor("",0,{},{updateDuplicates:true, item:item});
      res.json("");
  } catch (error) {
      console.error('Error processing JSON data:', error);
      res.status(400).json("Error processing JSON data");
  }
});

// **************** DEBUGGING *****************/ 


// Get http://serverAddr:4001/api/getstories
router.get('/getstories', async (req, res) => {
  const data = await inewsCache.getData();
  res.json(data);
});

// Get http://serverAddr:4001/api/getitems
router.get('/getitems', async (req, res) => {
  const data = itemsHash.getData();
  res.json(data);
});

export default router;