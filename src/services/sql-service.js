import appConfig from "../utilities/app-config.js";
import db from "../1-dal/sql.js";
import processAndWriteFiles from "../utilities/file-processor.js";
import inewsCache from "../1-dal/inews-cache.js";
import xml from "../utilities/xml-parser.js";
import itemsService from "./items-service.js";

class SqlService {

    async initialize(){
        try {
            // Delete stories table in mssql
            await this.deleteDBStories();
            for (const [rundownStr] of Object.entries(appConfig.rundowns)) {
                const assertedRDUid = await this.addDbRundown(rundownStr);
                await inewsCache.initializeRundown(rundownStr,assertedRDUid, appConfig.rundowns[rundownStr].production);
                console.log(await inewsCache.getRundownList(rundownStr))
            }
            
            await this.getAndStoreProductions();
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
                console.log(`Registering existing rundown to active watch: ${rundownStr}`);
                return selectResult.recordset[0].uid; // Return existing UID
            } else {
                // If record does not exist, insert a new one and return the new UID
                const insertResult = await db.execute(insertQuery, values);
                console.log(`Registering new rundown to active watch: ${rundownStr}`);
                return insertResult.recordset[0].uid; // Return new UID
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
                        const item = xml.parseXmlString(entry); //Returns {ord, itemId}
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
            await itemsService.compareItems(rundownStr,story);
            console.log(`Story modified in ${rundownStr}: ${story.storyName}`);
        } catch (error) {
            console.error('Error executing query:', error);  
        }

    }
    
    async compareAttachments(rundownStr, story) {
        
        const cachedStory = await inewsCache.getStory(rundownStr, story.identifier); // return {storyName,locator,flags,attachments,ord,uid}
        const cacheAttachments = cachedStory.attachments;
        const inewsAttachments = story.attachments;
    
        const events = []; 
    
        // Helper function to extract the necessary IDs from the XML string
        const extractIds = (xmlString) => {
            const { ord, itemId } = xml.parseXmlString(xmlString);
            return { order: ord, gfxItemId: itemId };
        };
    
        // Process each inewsAttachment to check for create, modify, or reorder events
        for (const [inewsOrder, inewsXml] of Object.entries(inewsAttachments)) {
            const { order: inewsOrd, gfxItemId: inewsGfxItemId } = extractIds(inewsXml);
    
            if (!cacheAttachments.hasOwnProperty(inewsOrder)) {
                // New entry or potentially a reorder
                let isReorder = false;
                for (const [cacheOrder, cacheXml] of Object.entries(cacheAttachments)) {
                    const { gfxItemId: cacheGfxItemId } = extractIds(cacheXml);
    
                    if (inewsGfxItemId === cacheGfxItemId) {
                        // Reorder check: compare XML content excluding gfxItemId
                        const inewsParsedForReorder = xml.parseXmlForReorder(inewsXml);
                        const cacheParsedForReorder = xml.parseXmlForReorder(cacheXml);
                        console.log(inewsParsedForReorder,cacheParsedForReorder);
                        if (JSON.stringify(inewsParsedForReorder) === JSON.stringify(cacheParsedForReorder)) {
                            events.push({ action: 'reorder', oldKey: cacheOrder, newKey: inewsOrder });
                            isReorder = true;
                            break;
                        }
                    }
                }
                if (!isReorder) {
                    events.push({ action: 'create', key: inewsOrder });
                    // Create item here
                    const rundownId = await inewsCache.getRundownList(rundownStr).uid;
                    //SHOW.ALEX.rundown2 { ord: 1, storyId: undefined, itemId: 82, rundownId: undefined }
                    
                    this.updateItem(rundownStr, {//{itemId, rundownId, storyId, ord}
                        ord: inewsOrd,
                        storyId: story.id, 
                        itemId:inewsGfxItemId, 
                        rundownId:rundownId
                    }); 
                }
            } else {
                // Existing entry, check if modified
                if (cacheAttachments[inewsOrder] !== inewsXml) {
                    events.push({ action: 'modify', key: inewsOrder });
                }
            } 
        }
    
        // Check for delete events
        for (const cacheOrder of Object.keys(cacheAttachments)) {
            if (!inewsAttachments.hasOwnProperty(cacheOrder)) {
                events.push({ action: 'delete', key: cacheOrder });
            }
        }
        console.log(events);
    
        return events;
    }
    
    async updateItem(rundownStr, item) { // Item: {itemId, rundownId, storyId, ord}
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

    async getItemData(itemUid){
        const values = {
            uid:itemUid
        };
    
        const sqlQuery = `
            SELECT data FROM ngn_inews_items WHERE uid = @uid;
        `;
    
        try {
            const result = await db.execute(sqlQuery, values);
            return result.recordset[0].data; // We return it to front page and its stored in mos obj as gfxItem
        } catch (error) {
            console.error('Error on fetching item data:', error);
            return null;
        }
    }

    // This func is triggered from a web page, when the user clicks "save"
    async updateItemFromFront(itemUid, item) { // Expect: {data, scripts, templateId, productionId}
        const values = {
            name: "", // You should define how to get the new 'name' value
            lastupdate: Math.floor(Date.now() / 1000),
            production: item.productionId,
            template: item.templateId,
            data: item.data,
            scripts: item.scripts,
            enabled: 1,
            tag: "", // You should define how to get the new 'tag' value
            uid: itemUid
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
            console.log(`Item ${itemUid} updated from the plugin`);
        } catch (error) {
            console.error('Error on updating GFX item:', error);
            // Since the function is void, we don't return anything, but you might want to handle the error appropriately
        }
    }

    
}    

const sqlService = new SqlService();

export default sqlService;