import conn from "../1-dal/inews-ftp.js";
import appConfig from "../utilities/app-config.js";
import hebDecoder from "../utilities/hebrew-decoder.js";
import sqlService from "./sql-service.js";
import inewsCache from "../1-dal/inews-cache.js";
import xmlParser from "../utilities/xml-parser.js";
import logger from "../utilities/logger.js";
import itemsService from "./items-service.js";
import lastUpdateService from "../utilities/rundown-update-debouncer.js";

class RundownProcessor {
    constructor() {
        this.setupConnectionListener();
        this.rundownsObj = {}; // {rundownStr:{uid:value, production:value}}
        this.rundowns = [];
        this.syncStories = [];
        this.skippedRundowns = {}; // {rundownStr:boolean,rundownStr:boolean,}
    }
    
    async startMainProcess() {
        await this.initialize();
    }

    async initialize() {
        logger('Starting Inews-connect 2.0.4...');
        await sqlService.initialize();
        this.rundownsObj = await inewsCache.getRundownsObj();
        this.rundowns = Object.keys(this.rundownsObj);
        for(const rundown of this.rundowns){
            this.skippedRundowns[rundown] = false;
        }
        this.rundownIterator();
    }

    async rundownIterator() {
       
        for (const rundownStr of this.rundowns) {
            await this.processRundown(rundownStr);
        }
        setTimeout(() => this.rundownIterator(), appConfig.pullInterval);
    }

    async processRundown(rundownStr) {
        try {
            const listItems = await conn.list(rundownStr);
            const filteredListItems = listItems.filter(item => item.fileType === 'STORY');
            const cachedLength = await inewsCache.getRundownLength(rundownStr);
            
            // If there is new stories in rundown
            if(cachedLength<filteredListItems.length && this.skippedRundowns[rundownStr] == false){
                logger(`Noticed new stories in rundown ${rundownStr}. Skipping for now.`);
                this.skippedRundowns[rundownStr] = true;
                return;
            }

            const storyPromises = this.processStories(rundownStr, filteredListItems);
            await Promise.all(storyPromises);
            await this.handleDeletedStories(rundownStr, filteredListItems);
            this.skippedRundowns[rundownStr] = false;
        } catch (error) {
            console.error("Error fetching and processing stories:", error);
        } 
    }

    processStories(rundownStr, listItems) {
        return listItems.map((listItem, index) => this.processStory(rundownStr, listItem, index));
    }

    async processStory(rundownStr, listItem, index) {
        try {
            const isStoryExists = await inewsCache.isStoryExists(rundownStr, listItem.identifier);
            listItem.storyName = hebDecoder(listItem.storyName);

            if (!isStoryExists) {
                await this.handleNewStory(rundownStr, listItem, index);
            } else {
                await this.handleExistingStory(rundownStr, listItem, index);
            }
        } catch (error) {
            console.error(`ERROR at Index ${index}:`, error);
        }
    }
    
    async handleNewStory(rundownStr, listItem, index) {
        // Get story string obj
        const story = await this.getStory(rundownStr, listItem.fileName);
        
        // Add parsed attachments 
        listItem.attachments = xmlParser.parseAttachments(story);
        
        // Add pageNumber
        listItem.pageNumber = story.fields.pageNumber;
        
        // Set enabled to 1 if attachment exists
        listItem.enabled = this.isEmpty(listItem.attachments) ? 0 : 1;

        // Store new story (without attachments!) in SQL, and get asserted uid
        const assertedStoryUid = await sqlService.addDbStory(rundownStr, listItem, index);
        
        // Add asserted uid to listItem
        listItem.uid = assertedStoryUid;

        // Save this story to cache
        await inewsCache.saveStory(rundownStr, listItem, index);

        await itemsService.itemProcessor(rundownStr,this.rundownsObj[rundownStr].uid, listItem, {newStory:true});

        lastUpdateService.triggerRundownUpdate(rundownStr)

        await sqlService.storyLastUpdate(assertedStoryUid);

    }

    async handleExistingStory(rundownStr, listItem, index) {
        const action = await this.checkStory(rundownStr, listItem, index);

        if (action === "reorder") {
            const rundownUid = await inewsCache.getRundownUid(rundownStr);
            await sqlService.reorderDbStory(rundownStr, listItem, index, rundownUid);
            await inewsCache.reorderStory(rundownStr, listItem, index);
            lastUpdateService.triggerRundownUpdate(rundownStr);
        } else if (action === "modify") {
            await this.modifyStory(rundownStr, listItem);
        } else if(this.syncStories.includes(listItem.fileName)){
            await this.modifyStory(rundownStr, listItem);
            logger(`Synced duplicate items in story [${listItem.fileName}] ${listItem.storyName} `);
            this.syncStories = this.syncStories.filter(filename => filename !== listItem.fileName);
            logger(`Stories left in sync stack: ${this.syncStories}`);
        }
    }
 
    async modifyStory(rundownStr, listItem) {
        
        // Fetch detailed story from inews
        const story = await this.getStory(rundownStr, listItem.fileName); 
        // Parse attachments
        listItem.attachments = xmlParser.parseAttachments(story);
        // Assign pageNumber
        listItem.pageNumber = story.fields.pageNumber;
        // Set enabled if attachments exists
        listItem.enabled = this.isEmpty(listItem.attachments) ? 0 : 1; 
        // Check for cached attachments (boolean)
        const cachedAttachments = await inewsCache.hasAttachments(rundownStr,listItem.identifier);
        
        if(listItem.enabled || cachedAttachments){            
            
            listItem.attachments = await itemsService.itemProcessor(rundownStr, this.getRundownUid(rundownStr), listItem); // Process attachments
        }
        const storyId = await inewsCache.getStoryUid(rundownStr,listItem.identifier);
        await sqlService.modifyDbStory(rundownStr, listItem, storyId);
        await sqlService.storyLastUpdate(storyId);
        lastUpdateService.triggerRundownUpdate(rundownStr);
        await inewsCache.modifyStory(rundownStr, listItem);
        
    }

    async handleDeletedStories(rundownStr, listItems) {
        if (listItems.length < await inewsCache.getRundownLength(rundownStr)) {
            await this.deleteDif(rundownStr, listItems);
        }
    }

    async checkStory(rundownStr, story, index) {
        const cacheStory = await inewsCache.getStory(rundownStr, story.identifier);
        if (index != cacheStory.ord) {
            return "reorder";
        }
        if (story.locator != cacheStory.locator) {
            return "modify";
        }
        return false;
    }

    async deleteDif(rundownStr, listItems) {
        const inewsHashMap = {};
        const cachedIdentifiers = await inewsCache.getRundownIdentifiersList(rundownStr);
        for (const listItem of listItems) {
            inewsHashMap[listItem.identifier] = 1;
        }
        const identifiersToDelete = cachedIdentifiers.filter(identifier => !inewsHashMap.hasOwnProperty(identifier));
        for (const identifier of identifiersToDelete) {
            const rundownUid = await inewsCache.getRundownUid(rundownStr);
            await sqlService.deleteStory(rundownStr, identifier, rundownUid);
            await inewsCache.deleteStory(rundownStr, identifier);
        }
    }

    async getStory(rundownStr, fileName) {
        return await conn.story(rundownStr, fileName);
    }

    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    setupConnectionListener() {
        conn.on('connections', connections => {
            logger(`${connections} FTP connections active`);
        });
    }

    getRundownUid(rundownStr){
        return this.rundownsObj[rundownStr].uid;
    }

    setSyncStoryFileNames(filenames){
        for(const filename of filenames){
            this.syncStories.push(filename);
            console.log(`DEBUG::::setSyncStoryFileNames=> this.syncStories: ${this.syncStories}`);
        }
    }


}

const processor = new RundownProcessor();
export default processor;