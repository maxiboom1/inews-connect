import express from "express";
import restService from "../services/rest-service.js";
const router = express.Router();

router.get('/watcher', async (req, res) => {
  const responseData = await restService.getInewsLineupFromStore();
  res.json(responseData);
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