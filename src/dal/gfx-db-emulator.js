import logger from "../utilities/logger.js";

class GfxStore {
    constructor() {
        this.gfxElement = {};
    }

    saveElement(id,element) {
        this.gfxElement[id] = element;
        logger(`Plugin command: Save ${id} gfx element- succeed`);
    }

    getElement(id) {
        if (!this.gfxElement[id]) {
            logger(`Plugin command: Get ${id} gfx element- not found`);
            return `Element ${id} not found`;
        }
        logger(`Plugin command: Get ${id} gfx element- succeed`);
        return this.gfxElement[id];
    }
}

const gfxStore = new GfxStore();

export default gfxStore;