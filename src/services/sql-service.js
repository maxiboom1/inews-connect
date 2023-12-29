import appConfig from "../utilities/app-config.js";
import db from "../1-dal/sql.js";
import processAndWriteFiles from "../utilities/file-processor.js";
import inewsCache from "../1-dal/inews-cache.js";
import parseXmlString from "../utilities/xml-parser.js";

class SqlService {

    async initialize(){
        try {
            // Delete stories table in mssql
            await this.deleteDBStories();
            // Iterate over appconfig rundowns, add them to db, and set in cache 
            for (const [rundownStr] of Object.entries(appConfig.rundowns)) {
                await this.addDbRundown(rundownStr);
                await inewsCache.initializeRundown(rundownStr);
            }
            await this.getAndStoreProductions();
            await this.getAndStoreDBRundowns();
            await this.getAndStoreTemplates();
        }        
        catch (error) {
            throw error;
        }
    }

    async addDbRundown(rundownStr) {
        const values = {
            name: rundownStr,
            lastUpdate: Math.floor(Date.now() / 1000),
            production: appConfig.rundowns[rundownStr].production,
            enabled: 1,
            tag: ""
        };
    
        const selectQuery = `
            SELECT uid FROM ngn_inews_rundowns WHERE name = @name;
        `;
    
        const insertQuery = `
            INSERT INTO ngn_inews_rundowns (name, lastupdate, production, enabled, tag)
            VALUES (@name, @lastUpdate, @production, @enabled, @tag);
        `;
    
        const updateQuery = `
            UPDATE ngn_inews_rundowns
            SET lastupdate = @lastUpdate, 
                production = @production, 
                enabled = @enabled, 
                tag = @tag
            WHERE name = @name;
        `;
    
        try {
            // Check if a record with the specified name exists
            const result = await db.execute(selectQuery, values);
            if (result.recordset.length > 0) {
                // If record exists, update it
                await db.execute(updateQuery, values);
                console.log(`Registering existing rundown to active watch: ${rundownStr}`);
            } else {
                // If record does not exist, insert a new one
                await db.execute(insertQuery, values);
                console.log(`Registering new rundown to active watch: ${rundownStr}`);
            }
        } catch (error) {
            console.error('Error registering rundown:', error);
        }
    }

    async getAndStoreProductions() {
        try {
            const sql = `SELECT uid, name FROM ngn_productions`;
            const productions = await db.execute(sql);
            await inewsCache.setProductions(productions);
            console.log(`Loaded productions from SQL`);
        } catch (error) {
            console.error('Error loading productions from SQL:', error);
            throw error;
        }
    }

    async getAndStoreDBRundowns(){
        try {
            const sql = `SELECT uid, name, production FROM ngn_inews_rundowns`;
            const rundowns = await db.execute(sql);
            await inewsCache.setRundowns(rundowns);
        } catch (error) {
            console.error('Error deleting rundown from SQL:', error);
            throw error;
        }
    }

    async getAndStoreTemplates() {
        try {
            const sql = `SELECT uid,source,name,production,icon FROM ngn_templates`;
            
            //{ uid, source, name, production,icon}
            const templates = await db.execute(sql);
            
            //{ uid, name, production , icon}
            const templatesWithoutHtml = await processAndWriteFiles(templates);
            await inewsCache.setTemplates(templatesWithoutHtml);
            console.log(`Loaded templates from SQL`);
        } catch (error) {
            console.error('Error loading templates from SQL:', error);
            throw error;
        }
    }

    async addDbStory(rundownStr, story, order){ //Story: {fileType,fileName,identifier,locator,storyName,modified,flags,attachments}
        const rundownMeta = await inewsCache.getRundownList(rundownStr);
        const values = {
            name: story.storyName,
            lastupdate: Math.floor(Date.now() / 1000),
            rundown: rundownMeta.uid,
            production: rundownMeta.production,
            ord: order,
            ordupdate: Math.floor(Date.now() / 1000),
            enabled: 1,
            tag: "",
            identifier: story.identifier,
            locator:story.locator
        }
        const sqlQuery = `
            INSERT INTO ngn_inews_stories (name, lastupdate, rundown, production, ord, ordupdate, enabled, tag, identifier, locator)
            OUTPUT inserted.uid
            VALUES (@name, @lastupdate, @rundown, @production, @ord, @ordupdate, @enabled, @tag, @identifier, @locator);`;            
        try {
            const result = await db.execute(sqlQuery, values);
            const assertedStoryUid = result.recordset[0].uid;
            story.uid = assertedStoryUid;
            
            //Check for items, and store
            if (Object.keys(story.attachments).length > 0){
                Object.entries(story.attachments).forEach(async ([key, entry]) => {
                    if (entry.includes("<gfxProduction>")) { // Make sure that its gfx attachment, if not we just skipping it
                        const item = parseXmlString(entry); //Returns {ord, itemId}
                        item.rundownId = rundownMeta.uid;
                        item.storyId = story.uid;
                        await sqlService.updateItem(rundownStr, item); // item: {itemId, rundownId, storyId, ord}
                    } else {
                        console.log(`Noticed non-gfx item. Skipping...`); 
                    }
                  });
            }

            await this.rundownOrdUpdate(rundownStr);
            console.log(`Registering new story to ${rundownStr}: ${story.storyName}`); 
            return assertedStoryUid;
        } catch (error) {
            console.error('Error executing query:', error); 
        }
    }

    async updateItem(rundownStr, item) { // Expect: {itemId, rundownId, storyId, ord}
        const values = {
            lastupdate: Math.floor(Date.now() / 1000),
            rundown: item.rundownId,
            story: item.storyId,
            ord: item.ord,
            ordupdate: Math.floor(Date.now() / 1000),
            uid: item.itemId
        };
        const sqlQuery = `
            UPDATE ngn_inews_items SET 
            lastupdate = @lastupdate, rundown = @rundown, story = @story, ord = @ord, ordupdate = @ordupdate
            OUTPUT INSERTED.*
            WHERE uid = @uid;`;
    
        try {
            const result =await db.execute(sqlQuery, values);
            if(result.rowsAffected[0] > 0){
                console.log("Registered new GFX item ");
            } else {
                console.log(`WARNING! GFX ${item.itemId} [${item.ord}] in ${rundownStr}, story num ${item.ord} doesn't exists in DB`);
            }

        } catch (error) {
            console.error('Error on storing GFX item:', error);
            return null;
        }
    }

    async reorderDbStory(rundownStr,story,ord){
        const values = {
            ord: ord,
            locator: story.locator,
            identifier: story.identifier,
            ordupdate: Math.floor(Date.now() / 1000),
        };
        
        const sqlQuery = `
            UPDATE ngn_inews_stories
            SET ord = @ord, ordupdate = @ordupdate, locator = @locator
            WHERE identifier = @identifier;
        `;
        try {
            await db.execute(sqlQuery, values);
            await this.rundownOrdUpdate(rundownStr);
            console.log(`Reorder story in ${rundownStr}: ${story.storyName}`);
        } catch (error) {
            console.error('Error executing query:', error);
        }

    }

    async modifyDbStory(rundownStr,story){//Story: {fileType,fileName,identifier,locator,storyName,modified,flags,attachments}
        const values = {
            identifier:story.identifier, // Filter param from sql ("WHERE ")
            name:story.storyName,
            lastupdate: Math.floor(Date.now() / 1000),
            locator: story.locator
        };
        
        const sqlQuery = `
            UPDATE ngn_inews_stories
            SET name = @name, lastupdate = @lastupdate, locator = @locator
            WHERE identifier = @identifier;
        `;

        try {
            await db.execute(sqlQuery, values);
            await this.rundownOrdUpdate(rundownStr);
            const itemsModified = await this._compareItems(rundownStr,story);
            console.log(itemsModified);
            console.log(`Story modified in ${rundownStr}: ${story.storyName}`);
        } catch (error) {
            console.error('Error executing query:', error);  
        }

    }
    
    /**
     * Items processor. Handles item create, modify, reorder and delete actions.
     * @param {*} rundownStr 
     * @param {*} story 
     * @returns {boolean} 
     */
    async _compareItems1(rundownStr, story) {
        const cachedStory = await inewsCache.getStory(rundownStr, story.identifier); // return {storyName,locator,flags,attachments,ord,uid}
        
        // Filter entries in story.attachments that contain "<gfxProduction>"
        const filteredStoryAttachments = Object.fromEntries(
            Object.entries(story.attachments).filter(([_, entry]) => entry.includes("<gfxProduction>"))
        );
    
        const keys1 = Object.keys(filteredStoryAttachments);
        const keys2 = Object.keys(cachedStory.attachments);
    
        // Check if both objects have the same set of keys
        if (keys1.length !== keys2.length || !keys1.every(key => keys2.includes(key))) {
            return true;
        }
    
        // Check if values for each key are equal
        for (const key of keys1) {
            if (filteredStoryAttachments[key] !== cachedStory.attachments[key]) {
                return true;
            }
        }
    
        // Objects are equal
        return false;
    }
    
    /**
 * Items processor. Handles item created, modified, deleted, reorder actions.
 * @param {*} rundownStr 
 * @param {*} story 
 * @returns {Object} - Object indicating the action needed: { action: 'create' | 'update' | 'reorder' | 'delete' | 'none' }
 */
    async _compareItems(rundownStr, story) {
        const cachedStory = await inewsCache.getStory(rundownStr, story.identifier); // return {storyName,locator,flags,attachments,ord,uid}
        
        // Filter entries in story.attachments that contain "<gfxProduction>"
        const filteredStoryAttachments = Object.fromEntries(
            Object.entries(story.attachments).filter(([_, entry]) => entry.includes("<gfxProduction>"))
        );

        const keys1 = Object.keys(filteredStoryAttachments);
        const keys2 = Object.keys(cachedStory.attachments);

        // Check if both objects have the same set of keys
        if (keys1.length !== keys2.length || !keys1.every(key => keys2.includes(key))) {
            return { action: 'create' }; // Different set of keys, create action
        }

        // Check if values for each key are equal
        for (const key of keys1) {
            if (filteredStoryAttachments[key] !== cachedStory.attachments[key]) {
                return { action: 'update' }; // Different values, update action
            }
        }

        // Check if there are extra keys in cachedStory
        const extraKeysCache = keys2.filter(key => !keys1.includes(key));
        if (extraKeysCache.length > 0) {
            // Check if entries are equal for extra keys (reorder action)
            if (extraKeysCache.every(key => cachedStory.attachments[key] === filteredStoryAttachments[key])) {
                return { action: 'reorder' }; // Entries are equal, reorder action
            } else {
                return { action: 'delete' }; // Entries are not equal, delete action
            }
        }

        // Objects are equal
        return { action: 'none' }; // No action needed
    }

    async deleteStory(rundownStr,identifier) {
        try {
            const values = {identifier: identifier};
            const sqlQuery = `DELETE FROM ngn_inews_stories WHERE identifier = @identifier;`;
            await db.execute(sqlQuery, values);
            await this.rundownOrdUpdate(rundownStr);
            console.log(`Story with identifier ${identifier} deleted from ${rundownStr}`);
    
        } catch (error) {
            console.error(`Error deleting ${uid} story:`, error);
        }
    }
    
    async rundownOrdUpdate(rundownStr){
        const rundownMeta = await inewsCache.getRundownList(rundownStr);
        try {
            const values = {
                uid: rundownMeta.uid,
                lastupdate: Math.floor(Date.now() / 1000)
            }
            const sqlQuery = `
                UPDATE ngn_inews_rundowns
                SET lastupdate = @lastupdate
                WHERE uid = @uid;
            `;
            await db.execute(sqlQuery, values);
        } catch (error) {
            console.error('Error rundownOrdUpdate:', error);
        }     
    }

    async deleteDBStories() {
        try {
            const sql = `DELETE FROM ngn_inews_stories`;
            await db.execute(sql);
            console.log(`ngn_inews_stories cleared....`);
        } catch (error) {
            console.error('Error deleting stories from SQL:', error);
            throw error;
        }
    }
    // This func triggered from web  page, when user click "save"
    async storeNewItem(item) { // Expect: {data, scripts, templateId,productionId}
        const values = {
            name: "",
            lastupdate: Math.floor(Date.now() / 1000),
            production: item.productionId,
            rundown: "",
            story: "",
            ord: "",
            ordupdate: Math.floor(Date.now() / 1000),
            template: item.templateId,
            data: item.data,
            scripts: item.scripts,
            enabled: 1,
            tag: "",
        };
        
        const sqlQuery = `
            INSERT INTO ngn_inews_items (name, lastupdate, production, rundown, story, ord, ordupdate, template, data, scripts, enabled, tag)
            OUTPUT INSERTED.uid
            VALUES (@name, @lastupdate, @production, @rundown, @story, @ord, @ordupdate,@template, @data, @scripts, @enabled, @tag);`;
    
        try {
            const result = await db.execute(sqlQuery, values);
            return result.recordset[0].uid; // We return it to front page and its stored in mos obj as gfxItem
        } catch (error) {
            console.error('Error on storing GFX item:', error);
            return null;
        }
    }
    
}    

const sqlService = new SqlService();

export default sqlService;