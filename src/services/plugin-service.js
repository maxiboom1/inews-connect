import gfxStore from "../dal/gfx-db-emulator.js";
import xmlParser from "../utilities/xml-parser.js";

async function getGfxElement(id){

    return gfxStore.getElement(id);
}

async function saveGfxElement(element){ 
    const receivedId = xmlParser.getId(element);
    let id, finalMessage  = "";
    
    if(gfxStore.idExists(receivedId)){
        id = receivedId;
        finalMessage = xmlParser.insertId(element,id);     
    } else{
        id =Math.ceil(Math.random()*100000);
        finalMessage = xmlParser.insertId(element,id);
    };

    gfxStore.saveElement(id, finalMessage);
    return id;
}

export default {
    getGfxElement,
    saveGfxElement
}