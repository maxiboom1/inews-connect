class InewsCache {
    
    constructor() {
        this.productions = {}; //{name: uid,name2:uid2, ... other productions...}
        // OLD
        //this.templates = {}; // {templateName:{uid:uid, production:production,icon:iconData}, otherTemplateName:{...}, ...}
        this.templates = {}; // {templateUid: {templateName, production, icon}, ...}
        this.stories = {}; //{'rundownName': {'storyIdentifier': {storyProps...} } }; ==> see example at page footer
        this.rundownsList = {}; // {rundownName:{uid,production}, otherRundownName:{...}, ...}
    }

    // ********************* Init FUNCTIONS ********************** //

    async initializeRundown(rundownStr,uid,production) {
        this.stories[rundownStr] = {};
        this.rundownsList[rundownStr] = {};
        this.rundownsList[rundownStr] = {uid,production}
    }

    async setProductions(productions){ // Expect [{ uid: '20006', name: 'TEST' }, {...}]
        this.productions = {};
        for (let i = 0; i < productions.length; i++) {
            const {name, uid} ={...productions[i]};
            this.productions[name] = uid;
          }
    }
    // OLD
    // async setTemplates(templates){ // Expect: [{ uid, name, production, icon},{...}]
    //     this.templates = {};
    //     templates.forEach(t => {
    //         this.templates[t.name] = {uid:t.uid, production: t.production, icon:t.icon};
    //     });
    // }

    // NEW
    async setTemplates(templates) {
        this.templates = {};
        templates.forEach(t => {
            this.templates[t.uid] = { name: t.name, production: t.production, icon: t.icon };
        });
    }
    
    // ********************* PRODUCTIONS FUNCTIONS ********************** //
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

    // ********************* TEMPLATES FUNCTIONS ********************** //

    // OLD
    // async getTemplatesByProduction(productionUid) {
    //     const filteredTemplates = [];
      
    //     for (const [templateName, templateData] of Object.entries(this.templates)) {
    //       if (templateData.production === productionUid) {
    //         const { uid, production, icon } = templateData;
    //         const templateObject = { uid, production, icon, name: templateName };
    //         filteredTemplates.push(templateObject);
    //       }
    //     }
      
    //     return filteredTemplates;
    // }

    // NEW
    async getTemplatesByProduction(productionUid) {
        const filteredTemplates = [];
    
        for (const [uid, templateData] of Object.entries(this.templates)) {
            if (templateData.production === productionUid) {
                const { name, production, icon } = templateData;
                const templateObject = { uid, name, production, icon };
                filteredTemplates.push(templateObject);
            }
        }
    
        return filteredTemplates;
    }    

    // ********************* STORY FUNCTIONS ********************** //

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
            uid:story.uid,
            enabled:story.enabled,
            pageNumber:story.pageNumber
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
        this.stories[rundownStr][story.identifier].attachments = story.attachments;
        this.stories[rundownStr][story.identifier].pageNumber = story.pageNumber;
    }

    async deleteStory(rundownStr, identifier) {
        delete this.stories[rundownStr][identifier];
    }

    async hasAttachments(rundownStr, identifier) {
        // Check if the story and identifier exist
        if (this.stories[rundownStr] && this.stories[rundownStr][identifier]) {
            const attachments = this.stories[rundownStr][identifier].attachments;
            if (Object.keys(attachments).length === 0) return false;
            return true;
        }
    }
    
    // ********************* RUNDOWNS FUNCTIONS ********************** //

    async getRundownsArr(){ // Return arr of rundownStr's 
        return Object.keys(this.rundownsList);
    }

    async getRundownUid(rundownStr){
        return this.rundownsList[rundownStr].uid;
    }

    async getRundown(rundownStr) {
        return this.stories[rundownStr];
    }

    async getRundownList(rundownStr){
        return this.rundownsList[rundownStr];
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

    async getData() {
        return this.stories;
    }
    
}

const inewsCache = new InewsCache();

export default inewsCache;

/*
this.stories example
{
    "SHOW.ALEX.rundown2": {
        "1689F6A3": {
            "storyName": "anveks4ever",
            "locator": "000308ED:65930449",
            "flags": {
                "floated": false
            },
            "attachments": {
                "103": {
                    "gfxTemplate": 10005,
                    "gfxProduction": 2,
                    "itemSlug": "I like hard OOP",
                    "ord": 2
                },
                other items...
            },
            "ord": 0,
            "uid": "41999"
        },
        other stories...
    }
    other rundowns...
}
*/