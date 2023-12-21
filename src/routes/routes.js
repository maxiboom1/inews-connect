import express from "express";
import inewsCache from "../dal/inewsCache.js";

const router = express.Router();

// Get http://serverAddr:4001/api/productions
router.get('/productions', async (req, res) => {
  const productions = await inewsCache.getProductionsCache();
  res.json(productions);
});

// Get http://serverAddr:4001/api/templates
router.get('/templates', async (req, res) => {
  console.time()
  const templates = await inewsCache.getTemplatesCache();
  res.json(templates);
  console.timeEnd()

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
