import sqlAccess from "../services/sql-service.js";

class StoryCache {
    
    constructor() {
        this.stories = {};
    }
    
    async setStoryCache(stories){
        this.stories = {};
        this.stories = stories;
    }
    
    async getStoryCache(rundownStr) { 
        const rundowns = await sqlAccess.getCachedRundowns();
        const rundownUid = rundowns[rundownStr].uid;
        
        // Filter stories based on the provided rundownUid
        const result = Object.values(this.stories).filter(story => story.rundown === rundownUid);        
        return result;
    }
      
}

const storyCache = new StoryCache();

export default storyCache;