class InewsCache {
    
    constructor() {
        this.stories = {}; //{'rundownName': {'storyIdentifier': {storyProps...}, /* ...other stories... */}, /* ...other rundowns... */};
        this.productions = {}; //{name: uid,name2:uid2, ... other productions...}
        this.templates = {}; // {templateName:{uid:uid, production:production,icon:iconData}, otherTemplateName:{...}, ...}
        this.rundownsList = {}; // {rundownName:{uid,production}, otherRundownName:{...}, ...}
    }

    async initializeRundown(rundownStr) {
        if (!this.stories[rundownStr]) {
            this.stories[rundownStr] = {};
            this.rundownsList[rundownStr] = {};
        }
    }

    async setProductions(productions){ // Expect [{ uid: '20006', name: 'TEST' }, {...}]
        this.productions = {};
        for (let i = 0; i < productions.length; i++) {
            const {name, uid} ={...productions[i]};
            this.productions[name] = uid;
          }
    }

    async getProductions(){

        return this.productions;
    }

    async getProductionsArr(){
        let arr = [];
        for(const [name, uid] of Object.entries(this.productions)){
            arr.push({name,uid});
        }
        return arr;
    }

    async setRundowns(rundowns){ // Expect: [{ uid: '1825', name: 'SHOW.ALEX.rundown2', production: '1'}, {...}]
        rundowns.forEach(r => {
            this.rundownsList[r.name] = {uid:r.uid, production:r.production};
        });
    }

    async getRundownList(rundownStr){
        return this.rundownsList[rundownStr];
    }

    async getRundownsArr(){ // Return arr of rundownStr's 
        return Object.keys(this.rundownsList);
    }

    async getRundownUid(rundownStr){
        return this.rundownsList[rundownStr].uid;
    }

    async setTemplates(templates){ // Expect: [{ uid, name, production, icon},{...}]
        this.templates = {};
        templates.forEach(t => {
            this.templates[t.name] = {uid:t.uid, production: t.production, icon:t.icon};
        });
    }

    async getTemplatesByProduction(productionUid) {
        const filteredTemplates = [];
      
        for (const [templateName, templateData] of Object.entries(this.templates)) {
          if (templateData.production === productionUid) {
            const { uid, production, icon } = templateData;
            const templateObject = { uid, production, icon, name: templateName };
            filteredTemplates.push(templateObject);
          }
        }
      
        return filteredTemplates;
    }

    async getRundown(rundownStr) {
        return this.stories[rundownStr];
    }

    async getStory(rundownStr, identifier) {
        if (this.isStoryExists(rundownStr, identifier)) {
            return this.stories[rundownStr][identifier];
        }
    }

    async getStoryUid(rundownStr, identifier){
        if (this.isStoryExists(rundownStr, identifier)) {
            return this.stories[rundownStr][identifier].uid;
        }
    }

    async isStoryExists(rundownStr, identifier) {
        const storyExists = !!this.stories[rundownStr] && !!this.stories[rundownStr][identifier];
        return storyExists;
    }

    async saveStory(rundownStr, story, ord) {
        this.stories[rundownStr][story.identifier] = {
            storyName: story.storyName,
            locator: story.locator,
            flags: story.flags,
            attachments: story.attachments,
            ord: ord,
            uid:story.uid
        };
    }

    async reorderStory(rundownStr, story, ord) {
        this.stories[rundownStr][story.identifier].locator = story.locator;
        this.stories[rundownStr][story.identifier].ord = ord;
    }

    async modifyStory(rundownStr, story) {
        this.stories[rundownStr][story.identifier].storyName = story.storyName;
        this.stories[rundownStr][story.identifier].locator = story.locator;
        this.stories[rundownStr][story.identifier].flags = story.flags;
    }

    async deleteStory(rundownStr, identifier) {
        delete this.stories[rundownStr][identifier];
    }

    async getData() {
        return this.stories;
    }

    async getRundownLength(rundownStr) {
        const rundown = this.stories[rundownStr];
        return rundown ? Object.keys(rundown).length : 0;
    }

    async getRundownIdentifiersList(rundownStr) {
        const rundown = this.stories[rundownStr];
        if (!rundown) return [];
        return Object.keys(rundown);
    }

}

const inewsCache = new InewsCache();

export default inewsCache;

