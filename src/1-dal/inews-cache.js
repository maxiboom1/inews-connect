import replaceAndNormalizeSpaces from "../utilities/normalize.js";

class InewsCache {
    
    constructor() {
        this.productions = {}; //{name: {uid:uid, scenes:[]},name2:uid2, ... other productions...}
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

    async setProductions(productions){ // Expect [{ uid: '20006', name: 'TEST', properties: obj... }, {...}]
        this.productions = {};
        for (let i = 0; i < productions.length; i++) {
            const {name, uid, properties} ={...productions[i]};
            // This part takes production "properties" data, and simplifies it to needed obj:
            // scenes: [{name: "Scene Name",folders: 
            // [{name: "Folder Name",itemUids: 
            //[ /* Array of item UIDs */ ]},color:color// ... more folders]},// ... more scenes]
            const decodedStr = decodeURIComponent(properties);
            
            const productionData = JSON.parse(decodedStr);
            const scenes = productionData.Scenes.map(scene => {
                return {
                    name:replaceAndNormalizeSpaces(scene.Name),
                    color:scene.Color,
                    folders: scene.Folders.map(folder => ({
                        name: replaceAndNormalizeSpaces(folder.Name),
                        itemUids: folder.ItemUids
                    }))
                };
            });
            this.productions[name] = {uid, scenes};
            
          }
    }

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

    async getProductionsArr() {
        let arr = [];
        for (const [name, data] of Object.entries(this.productions)) {
            let production = {
                name: name,
                uid: data.uid,
                scenes: data.scenes.map(scene => ({
                    name: scene.name,
                    color:scene.color,
                    folders: scene.folders.map(folder => ({
                        name: folder.name,
                        itemUids: folder.itemUids
                    }))
                }))
            };
            arr.push(production);
        }
        return arr;
    }

    // ********************* TEMPLATES FUNCTIONS ********************** //

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
        if (await this.isStoryExists(rundownStr, identifier)) {
            return this.stories[rundownStr][identifier];
        }
    }

    async getStoryName(rundownStr, identifier) {
        
        if (await this.isStoryExists(rundownStr, identifier)) {
            return this.stories[rundownStr][identifier].storyName;
        }
        return null;
    }

    async getStoryById(rundownStr, storyId) {
        // Check if the rundown exists
        if (!this.stories[rundownStr]) {
            return null; // Rundown not found
        }
    
        // Iterate through all stories in the rundown
        for (const identifier in this.stories[rundownStr]) {
            const story = this.stories[rundownStr][identifier];
            // Check if the story's uid matches the provided storyId
            if (story.uid === storyId) {
                return story; // Return the matching story
            }
        }
    
        return null; // Story not found
    }

    async getStoryUid(rundownStr, identifier){
        if (await this.isStoryExists(rundownStr, identifier)) {
            return this.stories[rundownStr][identifier].uid;
        }
    }

    async isStoryExists(rundownStr, identifier) {
        const storyExists = !!this.stories[rundownStr] && !!this.stories[rundownStr][identifier];
        return storyExists;
    }

    async saveStory(rundownStr, story, ord) {
        const clearedAttachments = this._cleanAttachments(story.attachments);
        this.stories[rundownStr][story.identifier] = {
            fileName:story.fileName,
            storyName: story.storyName,
            locator: story.locator,
            flags: story.flags,
            attachments: clearedAttachments,
            ord: ord,
            uid:story.uid,
            enabled:story.enabled,
            pageNumber:story.pageNumber
        };
    }

    async reorderStory(rundownStr, story, ord) {
        this.stories[rundownStr][story.identifier].fileName = story.fileName;
        this.stories[rundownStr][story.identifier].locator = story.locator;
        this.stories[rundownStr][story.identifier].ord = ord;
    }

    async modifyStory(rundownStr, story) {
        const clearedAttachments = this._cleanAttachments(story.attachments);
        this.stories[rundownStr][story.identifier].fileName = story.fileName;
        this.stories[rundownStr][story.identifier].storyName = story.storyName;
        this.stories[rundownStr][story.identifier].locator = story.locator;
        this.stories[rundownStr][story.identifier].flags = story.flags;
        this.stories[rundownStr][story.identifier].attachments = clearedAttachments;
        this.stories[rundownStr][story.identifier].pageNumber = story.pageNumber;
        this.stories[rundownStr][story.identifier].enabled = story.enabled;    
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

    async getStoryAttachments(rundownStr,identifier){
        if (this.stories[rundownStr] && this.stories[rundownStr][identifier]) {
            return {...this.stories[rundownStr][identifier].attachments};
        }
    }

    async setStoryAttachments(rundownStr,identifier,attachments){
        if (this.stories[rundownStr] && this.stories[rundownStr][identifier]) {
            this.stories[rundownStr][identifier].attachments = attachments;
        }
    }

    async deleteSingleAttachment(rundownStr,identifier,attachmentId){
        if (this.stories[rundownStr] && this.stories[rundownStr][identifier] && this.stories[rundownStr][identifier].attachments[attachmentId]) {
            delete this.stories[rundownStr][identifier].attachments[attachmentId];
        }
    }
    
    // ********************* RUNDOWNS FUNCTIONS ********************** //

    async getRundownsObj(){
        return this.rundownsList;
    }
    async getRundownsArr(){ // Return arr of rundownStr's 
        return Object.keys(this.rundownsList);
    }

    async getRundownUid(rundownStr){
        return this.rundownsList[rundownStr].uid;
    }

    async getRundownStr(uid){
        for (const rundownStr in this.rundownsList) {
            if(this.rundownsList[rundownStr].uid === uid) return rundownStr;
        }
        return null;
    }

    async getRundown(rundownStr) {
        return this.stories[rundownStr];
    }

    async getRundownList(rundownStr){
        return this.rundownsList[rundownStr];
    }

    async getProdIdByRundown(rundownStr){
        return this.rundownsList[rundownStr].production;
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

    async getRundownStrAndStoryName(rundownUid, storyUid) {
        const result = {};
    
        // Look for the rundown by its UID
        const rundownStr = Object.keys(this.rundownsList).find(rundownStr => this.rundownsList[rundownStr].uid === rundownUid);
        if (!rundownStr) return result; // If no matching rundown, return an empty result
    
        result.rundown = rundownStr;
    
        // Look for the story by its UID within the found rundown
        const story = this.stories[rundownStr] ? Object.values(this.stories[rundownStr]).find(story => story.uid === storyUid) : null;
        if (story) {
            result.storyName = story.storyName;
        }
    
        return result;
    }
    
    async deleteRundown(rundownStr) {
        if (this.stories[rundownStr]) {
            this.stories[rundownStr] = {}; //clear, but keep the key
        }
    }

    async getData() {
        return this.stories;
    }
    // Remove gfxData and gfxScripts from attachments
    _cleanAttachments(attachments){
        const att = {};
        for(const [id,item] of Object.entries(attachments)){
            att[id] = {};
            att[id].gfxTemplate = item.gfxTemplate,
            att[id].gfxProduction = item.gfxProduction,
            att[id].name = item.name,
            att[id].ord = item.ord
        }
        return att;
    }

    
}

const inewsCache = new InewsCache();

export default inewsCache;

/*
this.stories example
{
    "SHOW.ALEX.rundown2": {
        "1689F6A3": {
            "fileName": "some file name"
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