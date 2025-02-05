import appConfig from "../utilities/app-config.js";
import db from "../1-dal/sql.js";
import processAndWriteFiles from "../utilities/file-processor.js";
import inewsCache from "../1-dal/inews-cache.js";
import itemsHash from "../1-dal/items-hashmap.js";
import createTick from "../utilities/time-tick.js";
import logger from "../utilities/logger.js";
import lastUpdateService from "../utilities/rundown-update-debouncer.js";

class SqlService {

// ****************************** INIT FUNCTIONS - RUNS ONCE ONLOAD ****************************** //
    constructor(){
        this.cutItemTimeout = appConfig.cutItemTimeout;
    }
    async initialize(){
        try {
            // Delete stories table in mssql 
            await this.deleteDBStories();
            for (const [rundownStr] of Object.entries(appConfig.rundowns)) {
                const assertedRDUid = await this.addDbRundown(rundownStr);
                await inewsCache.initializeRundown(rundownStr,assertedRDUid, appConfig.rundowns[rundownStr].production);
            }
            await this.getAndStoreProductions();
            await this.getAndStoreTemplates();
            await this.hideUnwatchedRundowns();
            await itemsHash.resetDuplicates();
        }        
        catch (error) {
            throw error;
        }
    }

    async deleteDBStories() {
        try {
            const sql = `DELETE FROM ngn_inews_stories`;
            await db.execute(sql);
            logger(`[SQL] ngn_inews_stories cleared....`);
        } catch (error) {
            console.error('Error deleting stories from SQL:', error);
            throw error;
        }
    }
    
    async addDbRundown(rundownStr) {
        const values = {
            name: rundownStr,
            lastUpdate: createTick(),
            production: appConfig.rundowns[rundownStr].production,
            enabled: 1,
            tag: ""
        };
    
        const selectQuery = `
            SELECT uid FROM ngn_inews_rundowns WHERE name = @name;
        `;
    
        const insertQuery = `
            INSERT INTO ngn_inews_rundowns (name, lastupdate, production, enabled, tag)
            OUTPUT INSERTED.uid
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
            const selectResult = await db.execute(selectQuery, values);
            if (selectResult.recordset.length > 0) {
                // If record exists, update it
                await db.execute(updateQuery, values);
                logger(`[SQL] Registering existing rundown to active watch: ${rundownStr}`);
                return selectResult.recordset[0].uid; // Return existing UID
            } else {
                // If record does not exist, insert a new one and return the new UID
                const insertResult = await db.execute(insertQuery, values);
                logger(`[SQL] Registering new rundown to active watch: ${rundownStr}`);
                return insertResult.recordset[0].uid; // Return new UID
            }
        } catch (error) {
            console.error('Error registering rundown:', error);
        }
    }
    
    async getAndStoreProductions() {
        try {
            const sql = `SELECT uid, name,properties FROM ngn_productions WHERE enabled = 1`;
            const productions = await db.execute(sql);
            await inewsCache.setProductions(productions);
            logger(`[SQL] Loaded productions from SQL`);
        } catch (error) {
            console.error('Error loading productions from SQL:', error);
            throw error;
        }
    }

    async getAndStoreTemplates() {
        try {
            const sql = `SELECT uid,source,name,production,icon FROM ngn_templates WHERE enabled = 1`;
            
            //{ uid, source, name, production,icon}
            const templates = await db.execute(sql);
            
            //{ uid, name, production , icon}
            const templatesWithoutHtml = await processAndWriteFiles(templates);
            await inewsCache.setTemplates(templatesWithoutHtml);
            logger(`[SQL] Loaded templates from SQL`);
        } catch (error) {
            console.error('Error loading templates from SQL:', error);
            throw error;
        }
    }

    async hideUnwatchedRundowns() { // Compare rundowns from db with cached, and set enable=0 to those who are not in cache
        try {
            const sql = `SELECT * FROM ngn_inews_rundowns`;
            const result = await db.execute(sql);
            const cacheRundowns = await inewsCache.getRundownsArr(); // Get rundowns from config.json
            const unwatchedRundowns = result.filter(item => !cacheRundowns.includes(item.name)).map(item => item.uid);
            for(const r of unwatchedRundowns){
                const values = {uid: r};
                const sql = "UPDATE ngn_inews_rundowns SET enabled=0 WHERE uid = @uid";
                await db.execute(sql,values);
            }
            logger(`[SYSTEM] Noticed ${unwatchedRundowns.length} unwatched rundowns in db.`);
        } catch (error) {
            console.error('Error deleting stories from SQL:', error);
            throw error;
        }
    }

// ****************************** STORY FUNCTIONS ****************************** //

    async addDbStory(rundownStr, story, order){ //Story: {fileType,fileName,identifier,locator,storyName,modified,flags,pageNumber,attachments{gfxitem{props}}}
        const rundownMeta = await inewsCache.getRundownList(rundownStr);
        const values = {
            name: story.storyName,
            lastupdate: createTick(),
            rundown: rundownMeta.uid,
            production: rundownMeta.production,
            ord: order,
            ordupdate: createTick(),
            enabled: story.enabled,
            floating: story.flags.floated,
            tag: "",
            identifier: story.identifier,
            locator:story.locator,
            number:story.pageNumber || "",
            properties:""
        }
        const sqlQuery = `
            INSERT INTO ngn_inews_stories (name, lastupdate, rundown, production, ord, ordupdate, enabled, floating, tag, identifier, locator,number, properties)
            OUTPUT inserted.uid
            VALUES (@name, @lastupdate, @rundown, @production, @ord, @ordupdate, @enabled, @floating, @tag, @identifier, @locator, @number,@properties);`;            
        try {
            const result = await db.execute(sqlQuery, values);
            const assertedStoryUid = result.recordset[0].uid;
            story.uid = assertedStoryUid;
            return assertedStoryUid;
        } catch (error) {
            console.error('Error executing query:', error); 
        }
    }

    async modifyDbStory(story, storyId){ //Story: {fileType,fileName,identifier,locator,storyName,modified,flags,attachments{gfxitem{props}}}
        const values = {
            identifier: story.identifier, // Filter param from sql ("WHERE ")
            name: story.storyName,
            lastupdate: createTick(),
            locator: story.locator,
            enabled: story.enabled,
            floating: story.flags.floated,
            number: story.pageNumber || "",
            uid: storyId

        };
        const sqlQuery = `
            UPDATE ngn_inews_stories
            SET name = @name, lastupdate = @lastupdate, locator = @locator, enabled = @enabled, floating = @floating, number=@number
            WHERE uid = @uid;
        `;
        
        try {
            await db.execute(sqlQuery, values);
        } catch (error) {
            console.error('Error executing query:', error);  
        }

    }


    async reorderDbStory(story,ord, rundownUid){
        const values = {
            ord: ord,
            locator: story.locator,
            identifier: story.identifier,
            ordupdate: createTick(),
            rundown: rundownUid
        };
        
        const sqlQuery = `
            UPDATE ngn_inews_stories
            SET ord = @ord, ordupdate = @ordupdate, locator = @locator
            WHERE identifier = @identifier AND rundown = @rundown;
        `;
        try {
            await db.execute(sqlQuery, values);
        } catch (error) {
            console.error('Error executing query:', error);
        }

    }

    async deleteStory(rundownStr,identifier, rundownUid) {
        try {
            const values = {identifier: identifier, rundown:rundownUid};
            const sqlQuery = `DELETE FROM ngn_inews_stories WHERE identifier = @identifier AND rundown = @rundown;`;
            await db.execute(sqlQuery, values);
            lastUpdateService.triggerRundownUpdate(rundownStr);
        } catch (error) {
            console.error(`Error deleting ${uid} story:`, error);
        }
    }

// ********************* ITEMS FUNCTIONS ********************** //

    async updateItem(rundownStr, item) { // Item: {itemId, rundownId, storyId, ord}
        const values = {
            lastupdate: createTick(),
            rundown: item.rundownId,
            story: item.storyId,
            ord: item.ord,
            ordupdate: createTick(),
            uid: item.itemId,
            enabled: 1
        };
        const sqlQuery = `
            UPDATE ngn_inews_items SET 
            lastupdate = @lastupdate, rundown = @rundown, story = @story, ord = @ord, ordupdate = @ordupdate, enabled = @enabled
            OUTPUT INSERTED.*
            WHERE uid = @uid;`;

        try {
            const result = await db.execute(sqlQuery, values);
            if (result.rowsAffected[0] > 0) {
                return { success: true, message: "Item updated successfully" };
            } else {
                return { success: false, message: "No rows affected" };
            }
        } catch (error) {
            console.error('updateItem:Error on storing GFX item:', error);
            return { success: false, message: "Database error", error: error.message };
        }
    }

    async updateItemOrd(rundownStr, item) { // Item: {itemId, rundownId, storyId, ord}
        const values = {
            ord: item.ord,
            ordupdate: createTick(),
            uid: item.itemId
        };
        const sqlQuery = `
            UPDATE ngn_inews_items SET 
            ord = @ord, ordupdate = @ordupdate
            OUTPUT INSERTED.*
            WHERE uid = @uid;`;
    
        try {
            const result =await db.execute(sqlQuery, values);
            if(result.rowsAffected[0] > 0){
                logger("Item Reordered event registered");
            }

        } catch (error) {
            console.error('Error on reordering GFX item:', error);
            return null;
        }
    }

    async updateItemSlug(rundownStr, item){// Item: {itemId, rundownId, storyId, itemSlug}
        const values = {
            lastupdate: createTick(),
            name:item.itemSlug,
            uid: item.itemId
        };
        const sqlQuery = `
            UPDATE ngn_inews_items SET 
            lastupdate = @lastupdate, name = @name
            OUTPUT INSERTED.*
            WHERE uid = @uid;`;
    
        try {
            const result =await db.execute(sqlQuery, values);
            // ADD HERE STORY UPDATE
            if(result.rowsAffected[0] > 0){
                logger("Registered new GFX item ");
            } else {
                logger(`WARNING! GFX ${item.itemId} [${item.ord}] in ${rundownStr}, story num ${item.ord} doesn't exists in DB`);
            }

        } catch (error) {
            console.error('updateItemSlug:Error on storing GFX item:', error);
            return null;
        }
    }

    async deleteItem(rundownStr, item){ //Item: {itemId, rundownId, storyId}
        const values = {uid: item.itemId};
        const sqlQuery = `DELETE FROM ngn_inews_items WHERE uid = @uid;`;
    
        try {
            const result =await db.execute(sqlQuery, values);
            if(result.rowsAffected[0] > 0){
                return { success: true, message: "Item deleted successfully" };
            } else {
                return { success: false, message: "No rows affected" };            
            }

        } catch (error) {
            console.error('Error deleting GFX item:', error);
            return { success: false, message: "Database error", error: error.message };
        }

    } 

    async disableItem(item){ //Item: {itemId, rundownId, storyId}

        const values = {uid: item.itemId};
        const sqlQuery = `
            UPDATE ngn_inews_items 
            SET enabled = 0
            WHERE uid = @uid;`;
    
        try {
            const result =await db.execute(sqlQuery, values);
            
            if (result.rowsAffected[0] > 0) {
                return { success: true, message: "Item disabled successfully" };
            } else {
                return { success: false, message: "No rows affected" };
            }

        } catch (error) {
            console.error('Error disabling GFX item:', error);
            return { success: false, message: "Database error", error: error.message };
        }

    } 
    
// ********************* FRONT-TRIGGERED ITEMS FUNCTIONS ********************** //

    //This func triggered from web  page, when user click "save". 
    //We don't save it to cache! It will be updated from inews-service modify story event.  
    
    async storeNewItem(item) { // Expect: {name, data, scripts, templateId,productionId}
        const values = {
            name: item.name,
            lastupdate: createTick(),
            production: item.productionId,
            rundown: "",
            story: "",
            ord: "",
            ordupdate: createTick(),
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
            itemsHash.addUnlinked(result.recordset[0].uid);
            return result.recordset[0].uid; // We return it to front page and its stored in mos obj as gfxItem
        } catch (error) {
            console.error('storeNewItem:Error on storing GFX item:', error);
            return null;
        }
    }

    async getItemData(itemUid){
        const values = {
            uid:itemUid
        };
    
        const sqlQuery = `
            SELECT data,name,rundown,story FROM ngn_inews_items WHERE uid = @uid;
        `;
    
        try {
            const result = await db.execute(sqlQuery, values);
            if(result.rowsAffected[0] === 0) return {data:"N/A"};
            // We return it to front page and its stored in mos obj as gfxItem
            return {
                data:result.recordset[0].data,
                name:result.recordset[0].name,
                rundown: result.recordset[0].rundown,
                story: result.recordset[0].story
            } 
        } catch (error) {
            console.error('Error on fetching item data:', error);
            return null;
        }
    }

    // This func is triggered from a web page, when the user clicks "save" 
    async updateItemFromFront(item) { // Expect: {name, data, scripts, templateId, productionId, gfxItem}
        const values = {
            name: item.name,
            lastupdate: createTick(),
            production: item.productionId,
            template: item.templateId,
            data: item.data,
            scripts: item.scripts,
            enabled: 1,
            tag: "", 
            uid: item.gfxItem
        };

        const sqlQuery = `
            UPDATE ngn_inews_items
            SET name = @name,
                lastupdate = @lastupdate,
                production = @production,
                template = @template,
                data = @data,
                scripts = @scripts,
                enabled = @enabled,
                tag = @tag
            WHERE uid = @uid;`;

        try {
            // Execute the update query with the provided values
            await db.execute(sqlQuery, values);
            logger(`Item ${item.gfxItem} updated from the plugin`);
        } catch (error) {
            console.error('Error on updating GFX item:', error);
        }
    }

    async updateItemFromItemsService(item) { // Expect: {name, data, scripts, templateId, productionId, gfxItem}
        const values = {
            name: item.name,
            lastupdate: createTick(),
            production: item.productionId,
            template: item.templateId,
            data: item.data,
            scripts: item.scripts,
            enabled: 1,
            tag: "", 
            uid: item.gfxItem
        };

        const sqlQuery = `
            UPDATE ngn_inews_items
            SET name = @name,
                lastupdate = @lastupdate,
                production = @production,
                template = @template,
                data = @data,
                scripts = @scripts,
                enabled = @enabled,
                tag = @tag
            WHERE uid = @uid;`;

        try {
            // Execute the update query with the provided values
            await db.execute(sqlQuery, values);
            logger(`Item ${item.gfxItem} updated`);
        } catch (error) {
            console.error('Error on updating GFX item:', error);
        }
    }
    
// ********************* LAST UPDATE && ORD LAST UPDATE FUNCTIONS ********************** //
    
    async rundownLastUpdate(rundownStr, msg=""){
            const rundownMeta = await inewsCache.getRundownList(rundownStr);
            try {
                const values = {
                    uid: rundownMeta.uid,
                    lastupdate: createTick()
                }
                const sqlQuery = `
                    UPDATE ngn_inews_rundowns
                    SET lastupdate = @lastupdate
                    WHERE uid = @uid;
                `;
                await db.execute(sqlQuery, values);
            } catch (error) {
                console.error('Error rundownLastUpdate:', error);
            }     
    }

    async storyLastUpdate(storyId){
        try {
            const values = {
                uid: storyId,
                lastupdate: createTick()
            }
            const sqlQuery = `
                UPDATE ngn_inews_stories
                SET lastupdate = @lastupdate
                WHERE uid = @uid;
            `;
            await db.execute(sqlQuery, values);
        } catch (error) {
            console.error('Error storyLastUpdate:', error);
        }     
}

// ********************* DUPLICATE ITEMS FUNCTIONS ********************** //

    async getFullItem(itemUid){
        const values = {
            uid:itemUid
        };
    
        const sqlQuery = `
            SELECT * FROM ngn_inews_items WHERE uid = @uid;
        `;
    
        try {
            const result = await db.execute(sqlQuery, values);
            if(result.rowsAffected[0] === 0) return null;
            
            return result.recordset[0];
 
        } catch (error) {
            console.error('Error on fetching item data:', error);
            return null;
        }
    }

    async storeDuplicateItem(item) { // Expect: {name, data, scripts, templateId,productionId}
        const sqlQuery = `
            INSERT INTO ngn_inews_items (name, lastupdate, production, rundown, story, ord, ordupdate, template, data, scripts, enabled, tag)
            OUTPUT INSERTED.uid
            VALUES (@name, @lastupdate, @production, @rundown, @story, @ord, @ordupdate,@template, @data, @scripts, @enabled, @tag);`;
    
        try {
            const result = await db.execute(sqlQuery, item);
            return result.recordset[0].uid; // We return it to front page and its stored in mos obj as gfxItem
        } catch (error) {
            console.error('storeDuplicateItem:Error on storing GFX item:', error);
            return null;
        }
    }

    
}    

const sqlService = new SqlService();

export default sqlService;

