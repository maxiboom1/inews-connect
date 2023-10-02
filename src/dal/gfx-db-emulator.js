class GfxStore {
    constructor() {
        this.gfxElement = {};
    }

    saveElement(id,element) {
        this.gfxElement[id] = element;
        console.log(this.gfxElement);
    }

    getElement(id) {
        if (!this.getElement[id]) return `Element ${id} not found`;
        return this.getElement[id];
    }
}

const gfxStore = new GfxStore();

export default gfxStore;