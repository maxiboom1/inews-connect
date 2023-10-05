import logger from "../utilities/logger.js";

class GfxStore {
    constructor() {
        this.gfxElement = {};
    }

    saveElement(id,element) {
        this.gfxElement[id] = element;
        logger(`Plugin command: Save ${id} gfx element- succeed`);
    }
    
    getAllElements() {
        logger(`Plugin command: Get all stored gfx elements- succeed`);
        return this.gfxElement;
    }

    getElement(id) {
        if (!this.gfxElement[id]) {
            logger(`Plugin command: Get ${id} gfx element- not found`);
            return `Element ${id} not found`;
        }
        logger(`Plugin command: Get ${id} gfx element- succeed`);
        return this.gfxElement[id];
    }

    idExists(id) {
        return this.gfxElement[id] !== undefined;
    }
}

const gfxStore = new GfxStore();

export default gfxStore;