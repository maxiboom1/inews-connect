import express from "express";
import inewsCache from "../dal/inewsCache.js";
import sqlAccess from "../services/sql-service.js";
import cloneCache from "../dal/clone-cache.js";

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

// Get http://serverAddr:4001/api/getdata
router.get('/getdata', async (req, res) => {
  const data = await cloneCache.getData();
  res.json(data);
});

export default router;