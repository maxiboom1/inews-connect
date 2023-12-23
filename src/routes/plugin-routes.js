import express from "express";
import sqlAccess from "../services/sql-service.js";

const router = express.Router();

router.post('/set-item', async (req, res) => {
    try {
        const item = req.body;
        await sqlAccess.storeNewItem(item);
        res.json("Got data");
    } catch (error) {
        console.error('Error processing JSON data:', error);
        res.status(400).json("Error processing JSON data");
    }
});

export default router;


/*
// router.post('/plugin/set-item', async (req, res) => {
//     let reqAsStr = '';
//     req.on('data', (chunk) => {
//         reqAsStr += chunk;
//     });

//     req.on('end', async () => {
//         try {
//             if(reqAsStr.indexOf("<mos>") !== -1){
//                 const id = await pluginService.saveGfxElement(reqAsStr);
//                 res.json({id:id});
//             }else{
//                 logger(`Plugin Notify: ${reqAsStr}`);
//                 res.json({ok:"ok"});
//             } 
            
//         } catch (error) {
//             console.error('Error processing XML data:', error);
//             res.status(400).json("Error processing XML data");
//         }
//     });
// });

// router.get('/plugin/gfx/:id', async (req, res) => {
//     const id = +req.params.id;
//     const responseData = await pluginService.getGfxElement(id);
//     const modifiedXml = xmlParser.xmlParser(responseData);
//     res.json(modifiedXml);
//   });
  
// router.get('/plugin/db', async (req, res) => {
//     const allElements = gfxStore.getAllElements();
//     res.json(allElements);
// });

// router.post('/plugin/debug', (req, res) => {
//     let message = '';
//     req.on('data', (chunk) => {message += chunk;});
//     req.on('end', () => {
//         try {
//             console.log("DEBUG: ", message);
//             res.sendStatus(200);
//         } catch (error) {
//             console.error('Error processing XML data:', error);
//             res.sendStatus(204);
//         }
//     });
// });
*/