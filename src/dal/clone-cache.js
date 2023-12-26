class CloneCache {
    constructor() {
        this.rundowns = {};
        this.productions = [];
        this.templates = [];
    }

    async initializeRundown(rundownStr) {
        if (!this.rundowns[rundownStr]) {
            this.rundowns[rundownStr] = {};
        }
    }

    async getRundown(rundownStr) {
        return this.rundowns[rundownStr];
    }

    async getStory(rundownStr, identifier) {
        if (this.isStoryExists(rundownStr, identifier)) {
            return this.rundowns[rundownStr][identifier];
        }
    }

    async isStoryExists(rundownStr, identifier) {
        const storyExists = !!this.rundowns[rundownStr] && !!this.rundowns[rundownStr][identifier];
        return storyExists;
    }

    async saveStory(rundownStr, story, ord) {
        this.rundowns[rundownStr][story.identifier] = {
            storyName: story.storyName,
            locator: story.locator,
            flags: story.flags,
            attachments: story.attachments,
            ord: ord
        };
    }

    async reorderStory(rundownStr, story, ord) {
        this.rundowns[rundownStr][story.identifier].locator = story.locator;
        this.rundowns[rundownStr][story.identifier].ord = ord;
    }

    async modifyStory(rundownStr, story) {
        this.rundowns[rundownStr][story.identifier].storyName = story.storyName;
        this.rundowns[rundownStr][story.identifier].locator = story.locator;
        this.rundowns[rundownStr][story.identifier].flags = story.flags;
    }

    async deleteStory(rundownStr, identifier) {
        delete this.rundowns[rundownStr][identifier];
    }

    async getData() {
        return this.rundowns;
    }

    async getRundownLength(rundownStr) {
        const rundown = this.rundowns[rundownStr];
        return rundown ? Object.keys(rundown).length : 0;
    }

    async getRundownIdentifiersList(rundownStr) {
        const rundown = this.rundowns[rundownStr];
        if (!rundown) return [];
        return Object.keys(rundown);
    }

    // Methods from InewsCache

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

    async getProductionByTemplateId(id){
        for(const template of this.templates){
            if(template.uid === id){
                return template.production;
            }
        }
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

const cloneCache = new CloneCache();

export default cloneCache;




// const rundownsModel = {
//     'SHOW.ALEX.RUNDOWN': {
//         '076B337F': {
//             storyName: '1',
//             locator: '0002E0B7:658812DB',
//             flags: {/* flags data */},
//             attachments: {/* expandedStory.attachments data */},
//             index: 0
//         },
//         // ... (other stories in 'SHOW.ALEX.RUNDOWN')
//     },
//     'ANOTHER.SHOW.RUNDOWN': {
//         '0080A93B': {
//             storyName: '11',
//             locator: '000307FF:6581FF11',
//             flags: {/* flags data */},
//             attachments: {/* expandedStory.attachments data */},
//             index: 7
//         },
//         // ... (other stories in 'ANOTHER.SHOW.RUNDOWN')
//     }
//     // ... (other rundowns)
// };





// class CloneCache {
//     constructor() {
//         this.rundowns = {}; //See object example in rundownsModel 
//     }

//     //Initialize rundowns. Called from sqlService.initialize
//     async initializeRundown(rundownStr){
//         if (!this.rundowns[rundownStr]) {
//             this.rundowns[rundownStr] = {};
//         }
//     }

//     async getRundown(rundownStr) {
//         return this.rundowns[rundownStr];
//     }

//     async getStory(rundownStr, identifier){
//         if(this.isStoryExists(rundownStr, identifier)){
//             return this.rundowns[rundownStr][identifier];
//         }
//     }

//     async isStoryExists(rundownStr,identifier){
//          // Check if the rundown and story identifier exist
//          const storyExists = !!this.rundowns[rundownStr] && !!this.rundowns[rundownStr][identifier];
//          // Return a boolean indicating whether the story exists
//          return storyExists;
//     }

//     async saveStory(rundownStr,story,ord) {
//         this.rundowns[rundownStr][story.identifier]={
//             storyName:story.storyName,
//             locator:story.locator,
//             flags:story.flags,
//             attachments:story.attachments,
//             ord:ord
//         };
//     }

//     async reorderStory(rundownStr,story,ord){
//         this.rundowns[rundownStr][story.identifier].locator = story.locator;
//         this.rundowns[rundownStr][story.identifier].ord = ord;
//     }

//     async modifyStory(rundownStr,story){
//         this.rundowns[rundownStr][story.identifier].storyName = story.storyName;
//         this.rundowns[rundownStr][story.identifier].locator = story.locator;
//         this.rundowns[rundownStr][story.identifier].flags = story.flags;
//     }

//     async deleteStory(rundownStr,identifier){
//         delete this.rundowns[rundownStr][identifier];
//     }

//     async getData(){
//         return this.rundowns;
//     }

//     async getRundownLength(rundownStr) {
//         const rundown = this.rundowns[rundownStr];

//         // Check if the rundown exists, and return its length or 0 if it doesn't
//         return rundown ? Object.keys(rundown).length : 0;
//     }

//     async getRundownIdentifiersList(rundownStr) {
//         const rundown = this.rundowns[rundownStr];

//         // Check if the rundown exists
//         if (!rundown) return []; 

//         // Extract and return the array of rundown identifiers
//         return Object.keys(rundown);
//     }
// }