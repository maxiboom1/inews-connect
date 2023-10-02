import logger from "../utilities/logger.js";
import gfxStore from "../dal/gfx-db-emulator.js";

async function getGfxElement(id){ 
    logger(`Plugin command: Get ${id} gfx element- succeed`);
    return gfxStore.getElement(id);
}

async function saveGfxElement(id, element){ 
    gfxStore.saveElement(id, element);
    logger(`Plugin command: Save ${id} gfx element- succeed`);
}

export default {
    getGfxElement,
    saveGfxElement
}