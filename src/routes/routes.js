import express from "express";
import restService from "../services/rest-service.js";
import lineupStore from "../dal/local-store.js";

const router = express.Router();

router.get('/watcher/:lineup', async (req, res) => {
  const lineup = req.params.lineup;
  const responseData = await restService.getInewsLineupFromStore(lineup);
  const activeLineup = await lineupStore.getActiveLineup();
  res.json({[activeLineup]:responseData});
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



export default router;