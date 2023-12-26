import appConfig from "../utilities/app-config.js";
import db from "../dal/sql.js";
import inewsCache from "../dal/inewsCache.js";
import processAndWriteFiles from "../utilities/file-processor.js";
import cloneCache from "../dal/clone-cache.js";

class SqlAccess {
    
    constructor() {
        this.hardcodedLineupList = appConfig.rundowns;
    }

    async initialize(){
        try {
            await this.deleteDBStories();
            for (const [rundownStr] of Object.entries(this.hardcodedLineupList)) {
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

    async syncStoryCache(){
        try {
            const sql = `SELECT * FROM ngn_inews_stories;`;
            const result = await db.execute(sql);
            await inewsCache.setStoryCache(result);
        } catch (error) {
            console.error('Failed to fetch ngn_inews_stories:', error);
            throw error;
        }
    }

    async addDbRundown(rundownStr) {
        const values = {
            name: rundownStr,
            lastUpdate: Math.floor(Date.now() / 1000),
            production: this.hardcodedLineupList[rundownStr].production,
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
    
            if (result.length > 0) {
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

    async addDbStory(rundownStr, story, order){
        const values = {
            name: story.storyName,
            lastupdate: Math.floor(Date.now() / 1000),
            rundown: this.hardcodedLineupList[rundownStr].uid,
            production: this.hardcodedLineupList[rundownStr].production,
            ord: order,
            ordupdate: Math.floor(Date.now() / 1000),
            enabled: 1,
            tag: "",
            identifier: story.identifier,
            locator:story.locator
        }
        const sqlQuery = `
            INSERT INTO ngn_inews_stories (name, lastupdate, rundown, production, ord, ordupdate, enabled, tag, identifier, locator)
            VALUES (@name, @lastupdate, @rundown, @production, @ord, @ordupdate, @enabled, @tag, @identifier, @locator);`;            
        try {
            await db.execute(sqlQuery, values); 
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
        try {
            const values = {
                uid: this.hardcodedLineupList[rundownStr].uid,
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

    async getAndStoreDBRundowns(){
        try {
            const sql = `SELECT * FROM ngn_inews_rundowns`;
            const rundowns = await db.execute(sql);
            
            // Convert rundown from DB to friendly structure {rundownName:{production:1, uid:1}}
            rundowns.forEach(item => {
                const { uid, name, production } = item;
                // Check if the rundown already exists in hardcodedLineupList
                if (this.hardcodedLineupList[name] !== undefined) {
                    // Update only if it already exists (Since we don't erase rundowns from db)
                    this.hardcodedLineupList[name] = { production: production, uid: uid };
                }
              });
        } catch (error) {
            console.error('Error deleting rundown from SQL:', error);
            throw error;
        }
    }

    async getCachedRundowns(){
        return this.hardcodedLineupList;
    }

    async getAndStoreProductions() {
        try {
            const sql = `SELECT * FROM ngn_productions`;
            const productions = await db.execute(sql);
            await inewsCache.setProductionsCache(productions);
            console.log(`Loaded productions from SQL`);
        } catch (error) {
            console.error('Error loading productions from SQL:', error);
            throw error;
        }
    }

    async getAndStoreTemplates() {
        try {
            const sql = `SELECT * FROM ngn_templates`;
            const templates = await db.execute(sql);
            const templatesWithoutHtml = await processAndWriteFiles(templates);
            await inewsCache.setTemplatesCache(templatesWithoutHtml);
            console.log(`Loaded templates from SQL`);
        } catch (error) {
            console.error('Error loading templates from SQL:', error);
            throw error;
        }
    }

    async storeNewItem(item) {
        const values = {
            name: "??",
            lastupdate: Math.floor(Date.now() / 1000),
            production: await inewsCache.getProductionByTemplateId(item.templateId),
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
            return result.recordset[0].uid;
        } catch (error) {
            console.error('Error on storing GFX item:', error);
            return null;
        }
    }
}    

const sqlAccess = new SqlAccess();

export default sqlAccess;