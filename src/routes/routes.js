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
  let rawData = '';
  req.on('data', (chunk) => {
      rawData += chunk;
  });

  req.on('end', () => {
      try {
          // rawData now contains the entire XML data as a string
          console.log('Data as string: ', rawData);

          // You can now parse the XML data as needed
          // Example: const parsedData = parseXml(rawData);

          // Respond to the request
          res.json("got ya");
      } catch (error) {
          console.error('Error processing XML data:', error);
          res.status(400).json("Error processing XML data");
      }
  });
});


export default router;