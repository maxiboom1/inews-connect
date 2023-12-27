import appConfig from "../utilities/app-config.js";
import db from "../dal/sql.js";
import processAndWriteFiles from "../utilities/file-processor.js";
import cloneCache from "../dal/inews-cache.js";
import inewsCache from "../dal/inews-cache.js";

class SqlService {

    async initialize(){
        try {
            // Delete stories table in mssql
            await this.deleteDBStories();
            // Iterate over appconfig rundowns, add them to db, and set in cache 
            for (const [rundownStr] of Object.entries(appConfig.rundowns)) {
                await this.addDbRundown(rundownStr);
                await cloneCache.initializeRundown(rundownStr);
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
            await cloneCache.setProductions(productions);
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
            await cloneCache.setRundowns(rundowns);
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
            await cloneCache.setTemplates(templatesWithoutHtml);
            console.log(`Loaded templates from SQL`);
        } catch (error) {
            console.error('Error loading templates from SQL:', error);
            throw error;
        }
    }

    async syncStoryCache(){
        try {
            const sql = `SELECT * FROM ngn_inews_stories;`;
            const result = await db.execute(sql);
            //await inewsCache.setStoryCache(result);
        } catch (error) {
            console.error('Failed to fetch ngn_inews_stories:', error);
            throw error;
        }
    }

    async addDbStory(rundownStr, story, order){
        const rundownMeta = await cloneCache.getRundownList(rundownStr);
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
            const assertedUid = result.recordset[0].uid;
            story.uid = assertedUid;
            await inewsCache.saveStory(rundownStr, story, order);
            await this.rundownOrdUpdate(rundownStr);
            console.log(`Registering new story to ${rundownStr}: ${story.storyName}`);
        } catch (error) {
            console.error('Error executing query:', error); 
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

    async modifyDbStory(rundownStr,story){

        const values = {
            identifier:story.identifier,
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
            console.log(`Story modified in ${rundownStr}: ${story.storyName}`);
        } catch (error) {
            console.error('Error executing query:', error);
        }

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
    
    // ---------------- Init reset, rundown ordupdate and getters/setters ----------------

    async rundownOrdUpdate(rundownStr){
        const rundownMeta = await cloneCache.getRundownList(rundownStr);
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
    
    async updateItem(item) { // Expect: {itemId, rundownId, storyId, ord}
        
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
            WHERE uid = @uid;`;
    
        try {
            await db.execute(sqlQuery, values);
            console.log("Registered new GFX item ");

        } catch (error) {
            console.error('Error on storing GFX item:', error);
            return null;
        }
    }
}    

const sqlService = new SqlService();

export default sqlService;