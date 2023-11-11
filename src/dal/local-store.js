import appConfig from "../utilities/app-config.js";
import db from "../dal/sql.js"; // Make sure to import your database module

class LineupStore {
    constructor() {
        this.lineupStore = {};
        this.activeLineup = appConfig.defaultLineup;
    }
    
    async initLineup(lineup = this.activeLineup) {
        try {
            // Reset the database
            await this.resetDB();
            // Initialize the lineup in memory
            this.lineupStore[lineup] = [];
            console.log(`Lineup ${lineup} initialized in the database.`);
        } catch (error) {
            console.error('Error initializing lineup (check localStore):', error);
            throw error;
        }
    }

    async getLineup(lineup = this.activeLineup) { // By default, return active lineup
        return this.lineupStore[lineup];
    }

    async saveStory(lineup, index, data) {
        this.lineupStore[lineup][index] = { ...data };
    }

    async getActiveLineup() {
        return this.activeLineup;
    }

    async setActiveLineup(lineup) {
        this.activeLineup = lineup;
        await this.initLineup(lineup);
    }

    async resetDB() {
        try {
            const sql = `DELETE FROM current_lineup`;
            const result = await db.execute(sql);
            console.log('DB cleaned!');
            return result;
        } catch (error) {
            console.error('Error resetting database:', error);
            throw error;
        }
    }
}

const lineupStore = new LineupStore();

export default lineupStore;






// import appConfig from "../utilities/app-config.js";

// class LineupStore {
//     constructor() {
//         this.lineupStore = {};
//         this.activeLineup = appConfig.defaultLineup;
//     }
    
//     initLineup(lineup = this.activeLineup){
//         this.lineupStore[lineup] = [];
//     }

//     getLineup(lineup = this.activeLineup) { // By default, return active lineup
//         return this.lineupStore[lineup];
//     }

//     saveStory(lineup,index,data) {
//         this.lineupStore[lineup][index] = {...data};
//     }

//     getActiveLineup(){
//         return this.activeLineup
//     }

//     setActiveLineup(lineup){
//         this.activeLineup = lineup;
//         this.initLineup(lineup);
//     }

// }

// const lineupStore = new LineupStore();

// export default lineupStore;