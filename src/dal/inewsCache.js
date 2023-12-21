import sqlAccess from "../services/sql-service.js";

class InewsCache {
    
    constructor() {
        this.stories = [];
        this.rundowns = [];
        this.productions = [];
        this.templates = [];
    }
    
    async setStoryCache(stories){
        this.stories = [];
        this.stories = stories;
    }
    
    async getStoryCache(rundownStr) { 
        const rundowns = await sqlAccess.getCachedRundowns();
        const rundownUid = rundowns[rundownStr].uid;
        
        // Filter stories based on the provided rundownUid
        const result = Object.values(this.stories).filter(story => story.rundown === rundownUid); 
        return result;
    }
      
    async setProductionsCache(productions){
        this.productions = [];
        // Remove large unused "property" field for now
        for (let i = 0; i < productions.length; i++) {
            delete productions[i].properties;
          }
        this.productions = productions;
    }

    async getProductionsCache(){
        return this.productions;
    }

    async setTemplatesCache(templates){
        this.templates = [];
        this.templates = templates;
    }

    async getTemplatesCache(productionUid){
        const filteredTemplates = [];
        for(const template of this.templates){
            if(template.production === productionUid){
                filteredTemplates.push(template);
            }
        }
        return filteredTemplates;
    }

}

const inewsCache = new InewsCache();

export default inewsCache;