import express from "express";
import pluginService from "../services/plugin-service.js";
import logger from "../utilities/logger.js";
import xmlParser from "../utilities/xml-parser.js";

const router = express.Router();

router.post('/plugin/gfx', async (req, res) => {
    let reqAsStr = '';
    req.on('data', (chunk) => {
        reqAsStr += chunk;
    });

    req.on('end', () => {
        try {
            if(reqAsStr.indexOf("<mos>") != -1){
                console.log("got id: ", xmlParser.getId(reqAsStr));
                const id = Math.ceil(Math.random()*100000);          
                pluginService.saveGfxElement(id,reqAsStr);
                res.json({id:id});
            }else{
                logger(`Plugin Notify: ${reqAsStr}`);
                res.json({ok:"ok"});
            } 
            
        } catch (error) {
            console.error('Error processing XML data:', error);
            res.status(400).json("Error processing XML data");
        }
    });
});

router.get('/plugin/gfx/:id', async (req, res) => {
    const id = +req.params.id;
    const responseData = await pluginService.getGfxElement(id);
    const modifiedXml = xmlParser.xmlParser(responseData);
    res.json(modifiedXml);
  });
  

export default router;