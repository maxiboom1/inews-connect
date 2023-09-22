import appConfig from "../utilities/app-config.js";

class LineupStore {
    constructor() {
        this.lineupStore = {};
        this.activeLineup = appConfig.defaultLineup;
    }
    
    initLineup(lineup){
        this.lineupStore[lineup] = [];
    }

    getLineup(lineup = this.activeLineup) { // By default, return active lineup
        return this.lineupStore[lineup];
    }

    saveStory(lineup,index,data) {
        this.lineupStore[lineup][index] = {...data};
    }

    getActiveLineup(){
        return this.activeLineup
    }

    setActiveLineup(lineup){
        this.activeLineup = lineup;
        this.initLineup(lineup);
    }

}

const lineupStore = new LineupStore();

export default lineupStore;