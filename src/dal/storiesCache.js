import appConfig from "../utilities/app-config.js";
import db from "./sql.js"; // Make sure to import your database module

class StoryCache {
    
    constructor() {
        this.stories = {};
    }
    
    async syncStoryCache(){
        console.log('sync');
        try {
            const sql = `SELECT * FROM ngn_inews_stories;`;
            const result = await db.execute(sql);
            this.stories = result;
        } catch (error) {
            console.error('Error deleting stories from SQL:', error);
            throw error;
        }
    }

    async getStroyCache() { 
        return this.stories;
    }
      
}

const storyCache = new StoryCache();

export default storyCache;