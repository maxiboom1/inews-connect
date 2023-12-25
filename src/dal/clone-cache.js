
class CloneCache {
    constructor() {
        this.rundowns = {}; //See object example in rundownsModel 
    }

    //Initialize rundowns. Called from sqlService.initialize
    async initializeRundown(rundownStr){
        if (!this.rundowns[rundownStr]) {
            this.rundowns[rundownStr] = {};
        }
    }

    async getRundown(rundownStr) {
        return this.rundowns[rundownStr];
    }

    async saveStory(rundownStr,ord,story,expandedStory) {
        this.rundowns[rundownStr][story.identifier]={
            storyName:story.storyName,
            locator:story.locator,
            flags:story.flags,
            attachments:expandedStory.attachments,
            ord:ord
        };
    }

    async reorderStory(rundownStr,story,ord){
        this.rundowns[rundownStr][story.identifier].locator = story.locator;
        this.rundowns[rundownStr][story.identifier].ord = ord;
    }

    async modifyStory(rundownStr,story){
        this.rundowns[rundownStr][story.identifier].storyName = story.storyName;
        this.rundowns[rundownStr][story.identifier].locator = story.locator;
        this.rundowns[rundownStr][story.identifier].flags = story.flags;
    }

    async deleteStory(rundownStr,identifier){
        delete this.rundowns[rundownStr][identifier];
    }

    async getData(){
        return this.rundowns;
    }
}

const cloneCache = new CloneCache();

export default cloneCache;

// Example Data for dev
const rundownsModel = {
    'SHOW.ALEX.RUNDOWN': {
        '076B337F': {
            storyName: '1',
            locator: '0002E0B7:658812DB',
            flags: {/* flags data */},
            attachments: {/* expandedStory.attachments data */},
            index: 0
        },
        // ... (other stories in 'SHOW.ALEX.RUNDOWN')
    },
    'ANOTHER.SHOW.RUNDOWN': {
        '0080A93B': {
            storyName: '11',
            locator: '000307FF:6581FF11',
            flags: {/* flags data */},
            attachments: {/* expandedStory.attachments data */},
            index: 7
        },
        // ... (other stories in 'ANOTHER.SHOW.RUNDOWN')
    }
    // ... (other rundowns)
};