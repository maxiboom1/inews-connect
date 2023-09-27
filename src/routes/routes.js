import express from "express";
import restService from "../services/rest-service.js";
const router = express.Router();

router.get('/watcher/:lineup', async (req, res) => {
  const lineup = req.params.lineup;
  const responseData = await restService.getInewsLineupFromStore(lineup);
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

router.post('/plugin', async (req, res) => {
  const message = req.body;
  console.log(message.mos);
  res.json("got ya");
});


export default router;