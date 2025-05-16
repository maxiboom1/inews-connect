import conn from "../1-dal/inews-ftp.js";
import appConfig from "../utilities/app-config.js";
import hebDecoder from "../utilities/hebrew-decoder.js";
import sqlService from "./sql-service.js";
import inewsCache from "../1-dal/inews-cache.js";
import xmlParser from "../utilities/xml-parser.js";
import logger from "../utilities/logger.js";
import itemsService from "./items-service.js";
import lastUpdateService from "../utilities/rundown-update-debouncer.js";
import cache from "../1-dal/inews-cache.js";
import deleteService from "./delete-service.js";
import timeMeasure from "../utilities/time-measure.js";
import logMessages from "../utilities/logger-messages.js";

class RundownProcessor {
    
    constructor() {
        this.setupConnectionListener();
        this.rundownsObj = {}; // {rundownStr:{uid:value, production:value}, ...}
        this.rundowns = [];
        this.syncStories = new Map(); // {identifier: {rundownStr, counter}, ...}
        this.skippedRundowns = {}; // {rundownStr:counter, ...}
        this.loading = false;
    }
    
    async startMainProcess() {
        this.loading = true;
        timeMeasure.start();
        await this.initialize();
    }

    async initialize() {
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
        
        this.updateSyncStoriesMap();        
        
        setTimeout(() => this.rundownIterator(), appConfig.pullInterval);

        if (this.loading) {
            logMessages.appLoadedMessage(this.rundowns);
            this.loading = false;
        }
    }

    async processRundown(rundownStr) {
        try {

            const listItems = (await conn.list(rundownStr)).filter(item => item.fileType === 'STORY');
            const cachedLength = await inewsCache.getRundownLength(rundownStr);
            
            if(this.loading === false && this._shouldSkipRundown(rundownStr, cachedLength, listItems.length)) return;
            
            let index = 0;
            for (const listItem of listItems) {
                await this.processStory(rundownStr, listItem, index);
                index++;
            }
            
            await this.handleDeletedStories(rundownStr, listItems);

        } catch (error) {
            console.error("Error fetching and processing stories:", error);
        } 
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
        logger(`[STORY] Registering new story to {${rundownStr}}: {${listItem.storyName}}`); 
        
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
            await sqlService.reorderDbStory(listItem, index, rundownUid);
            await inewsCache.reorderStory(rundownStr, listItem, index);
            lastUpdateService.triggerRundownUpdate(rundownStr);
            logger(`[STORY] Reorder story in ${rundownStr}: ${listItem.storyName}`);
        } else if (action === "modify") {
            await this.modifyStory(rundownStr, listItem);
        
        } else if (this.syncStories.has(listItem.identifier) && this.syncStories.get(listItem.identifier).rundownStr === rundownStr) {
            await this.modifyStory(rundownStr, listItem);
            logger(`[STORY] Synced duplicate item/s in story [${listItem.storyName}]`);
            this.syncStories.delete(listItem.identifier); 
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
        await sqlService.modifyDbStory(listItem, storyId);
        await sqlService.storyLastUpdate(storyId);
        lastUpdateService.triggerRundownUpdate(rundownStr);
        await inewsCache.modifyStory(rundownStr, listItem);
        logger(`[STORY] Story modified in ${rundownStr}: ${listItem.storyName}`);
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

    async handleDeletedStories(rundownStr, listItems) {
        if (listItems.length < await inewsCache.getRundownLength(rundownStr)) {
            await this.deleteDif(rundownStr, listItems);
        }
    }

    async deleteDif(rundownStr, listItems) {
        const inewsHashMap = {};
        const cachedIdentifiers = await inewsCache.getRundownIdentifiersList(rundownStr);
        for (const listItem of listItems) {
            inewsHashMap[listItem.identifier] = 1;
        }
        
        const identifiersToDelete = cachedIdentifiers.filter(identifier => !inewsHashMap.hasOwnProperty(identifier));
        
        for (const identifier of identifiersToDelete) {
            await this.deleteStoryItems(rundownStr, identifier);
            const rundownUid = await inewsCache.getRundownUid(rundownStr);
            await sqlService.deleteStory(rundownStr, identifier, rundownUid);
            await inewsCache.deleteStory(rundownStr, identifier);
            logger(`[STORY] Story with identifier ${identifier} deleted from ${rundownStr}`);

        }

    }

    async deleteStoryItems(rundownStr, identifier){
        const items = await cache.getStoryAttachments(rundownStr,identifier);
        
        if(Object.keys(items).length > 0){
            for(const itemId of Object.keys(items)){
                const itemToDelete = {
                    itemId: itemId, // item id to delete
                    rundownId: this.rundownsObj[rundownStr].uid, 
                    storyId: cache.getStoryUid(rundownStr, identifier)
                }

                await deleteService.triggerDeleteItem(rundownStr,itemToDelete, identifier); 
            }
            
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
            logger(`[SYSTEM] ${connections} FTP connections active`);
        });
    }

    getRundownUid(rundownStr){
        return this.rundownsObj[rundownStr].uid;
    }
    
    setSyncStory(storiesMap) {// Except: {identifier:rundownStr} obj
        for (const [identifier, rundownStr] of Object.entries(storiesMap)) {
            this.syncStories.set(identifier, {rundownStr, counter:3});
        }
    }

    updateSyncStoriesMap() {
        const toDelete = [];
        for (const [identifier, data] of this.syncStories.entries()) {
            if (data.counter > 0) {
                data.counter--;
            } else {
                toDelete.push(identifier); // Collect items for deletion
            }
        }
    
        // Remove after iteration (avoids modifying the map while iterating)
        for (const identifier of toDelete) {
            this.syncStories.delete(identifier);
        }
    }

    async resetRundownByUid(rundownUid) {
        console.log(`Got reset command: ${rundownUid}`);
        return { ok: true };
    }

    _shouldSkipRundown(rundownStr, cachedLength, listItemsLength,){
        
        // If there is new stories in rundown
        if(cachedLength < listItemsLength){
            const skip = this._skipHandler(rundownStr, 2, `[SKIPPER] Noticed new stories in rundown ${rundownStr}. Skipping..`);
            if(skip) return true;
            logger(`[SKIPPER] Starting processing new stories in ${rundownStr}`, "blue");
        } 

        // If there is more than 5 stories deleted - delay twice
        if(cachedLength> 5+listItemsLength ){
            const skip = this._skipHandler(rundownStr, 1, `[SKIPPER] Noticed batch delete in rundown ${rundownStr}. Skipping...`);
            if(skip) return true;
            logger(`[SKIPPER] Starting processing deleted stories in ${rundownStr}`, "blue");
        }
         
        this.skippedRundowns[rundownStr] = false;
        return false;

    }

    _skipHandler(rundownStr, skipCounter, logMessage){
        
        if(this.skippedRundowns[rundownStr] === false){
            this.skippedRundowns[rundownStr] = skipCounter;
            logger(logMessage,"green");
            return true;
        }
        
        if(this.skippedRundowns[rundownStr]>0){
            this.skippedRundowns[rundownStr]--;
            return true;
        }

        return false;
    }
}

const processor = new RundownProcessor();
export default processor;