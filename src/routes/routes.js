import express from "express";
import inewsCache from "../dal/inewsCache.js";
import sqlAccess from "../services/sql-service.js";

const router = express.Router();

// Get http://serverAddr:4001/api/productions
router.get('/productions', async (req, res) => {
  const productions = await inewsCache.getProductionsCache();
  res.json(productions);
});

// Get http://serverAddr:4001/api/templates
router.get('/templates/:uid', async (req, res) => {
  const productionUid = req.params.uid;
  const templates = await inewsCache.getTemplatesCache(productionUid);
  res.json(templates);
});

// Post http://serverAddr:4001/api/set-item
router.post('/set-item', async (req, res) => {
  try {
      const item = req.body;
      const templateUid = await sqlAccess.storeNewItem(item);
      res.json(templateUid);
  } catch (error) {
      console.error('Error processing JSON data:', error);
      res.status(400).json("Error processing JSON data");
  }
});

export default router;


/*
router.get('/watcher/:lineup', async (req, res) => {
  const lineup = req.params.lineup;
  const responseData = await restService.getInewsLineupFromStore(lineup);
  const activeLineup = await lineupStore.getActiveLineup();
  res.json({[activeLineup]:responseData});
});
router.get('/get', async (req, res) => {
  const store = await lineupStore.getStore();
  res.json(store);
});
  
router.get('/services/get-dir/:dirName', async (req, res) => {
  const dirName = req.params.dirName;
  const responseData = await restService.getAvailableLineups(dirName);
  res.json( responseData );
});

router.post('/services/set-watcher/:lineupName', async (req, res) => {
  const lineupName = req.params.lineupName;
  const response = await restService.setActiveLineup(lineupName);
  res.json(response);
});

*/
