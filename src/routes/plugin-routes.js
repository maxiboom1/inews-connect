import express from "express";

const router = express.Router();

router.post('/plugin/gfx', async (req, res) => {
  let rawData = '';
  req.on('data', (chunk) => {
      rawData += chunk;
  });

  req.on('end', () => {
      try {
          // You can now parse the XML data as needed
          console.log('Data as string: ', rawData);
          const randomNumber = Math.ceil(Math.random()*1000);
          // Respond to the request
          res.json({id:randomNumber});
      } catch (error) {
          console.error('Error processing XML data:', error);
          res.status(400).json("Error processing XML data");
      }
  });
});


export default router;