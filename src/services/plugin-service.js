import gfxStore from "../dal/gfx-db-emulator.js";

async function getGfxElement(id){
    return gfxStore.getElement(id);
}

async function saveGfxElement(id, element){ 
    // Insert the assigned id to mos string
    element = element.replace("<gfxItem>null</gfxItem>",`<gfxItem>${id}</gfxItem>`);
    element = element.replace("<gfxItem>null</gfxItem>",`<gfxItem>${id}</gfxItem>`);
    gfxStore.saveElement(id, element);
}

export default {
    getGfxElement,
    saveGfxElement
}