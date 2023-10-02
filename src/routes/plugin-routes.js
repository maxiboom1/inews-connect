import express from "express";
import pluginService from "../services/plugin-service.js";

const router = express.Router();

router.post('/plugin/gfx', async (req, res) => {
    let reqAsStr = '';
    req.on('data', (chunk) => {
        reqAsStr += chunk;
    });

    req.on('end', () => {
        try {
            if(reqAsStr.indexOf("<mos>") != -1){
                const id = Math.ceil(Math.random()*100000);          
                pluginService.saveGfxElement(id,reqAsStr);
                res.json({id:id});
            }else{
                res.sendStatus(204);
            } 
            
        } catch (error) {
            console.error('Error processing XML data:', error);
            res.status(400).json("Error processing XML data");
        }
    });
});

router.get('/plugin/gfx/:id', async (req, res) => {
    const id = req.params.id;
    const responseData = await pluginService.getGfxElement(id);
    res.json(responseData);
  });
  

export default router;