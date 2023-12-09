import appConfig from "../utilities/app-config.js";
import db from "../dal/sql.js";
import storyCache from "../dal/storiesCache.js";

class SqlAccess {
    
    constructor() {
        this.hardcodedLineupList = appConfig.rundowns;
    }

    async initialize(){
        try {
            await this.deleteDBStories();
            await this.deleteDBRundowns();
            for (const [rundownStr] of Object.entries(this.hardcodedLineupList)) {
                await this.addDbRundown(rundownStr);
            }
        }        
        catch (error) {
            throw error;
        }
    }

    async addDbRundown(rundownStr){
        const values = {
            name:rundownStr,
            lastupdate: Math.floor(Date.now() / 1000),
            production: this.hardcodedLineupList[rundownStr].production,
            enabled: 1,
            tag: ""
        }
        const sqlQuery = `
        INSERT INTO ngn_inews_rundowns (name, lastupdate, production, enabled, tag)
        OUTPUT Inserted.uid
        VALUES (@name, @lastUpdate, @production, @enabled, @tag);`;            
        try {
            const result = await db.execute(sqlQuery, values); 
            const uid = result[0].uid;
            this.hardcodedLineupList[rundownStr].uid = uid;
            console.log(`Added to watch list: ${rundownStr}`);

        } catch (error) {
            console.error('Error executing query:', error);
        }

    }

    async addDbStory(rundownStr, story, expandedStoryData, order){
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

    async reorderDbStory(story,ord, rundownStr){
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

    async modifyDbStory(story,rundownStr){

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

    async deleteStories(rundownStr, ord) {
        try {
            const values = {
                rundown: this.hardcodedLineupList[rundownStr].uid,
                ord: ord-1,
            };
            console.log(values);
            const sqlQuery = `
                DELETE FROM ngn_inews_stories
                WHERE rundown = @rundown
                AND ord > @ord;
            `;
    
            await db.execute(sqlQuery, values);
            await this.rundownOrdUpdate(rundownStr);
            console.log(`Story deleted in ${rundownStr}`);
    
        } catch (error) {
            console.error('Error executing query:', error);
        }
    }
    
    async syncStoryCache(){
        try {
            const sql = `SELECT * FROM ngn_inews_stories;`;
            const result = await db.execute(sql);
            await storyCache.setStoryCache(result);
        } catch (error) {
            console.error('Failed to fetch ngn_inews_stories:', error);
            throw error;
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

    async deleteDBRundowns() {
        try {
            const sql = `DELETE FROM ngn_inews_rundowns`;
            await db.execute(sql);
            console.log(`ngn_inews_rundowns cleared....`);
        } catch (error) {
            console.error('Error deleting rundown from SQL:', error);
            throw error;
        }
    }

    async getCachedRundowns(){
        return this.hardcodedLineupList;
    }
}

const sqlAccess = new SqlAccess();

export default sqlAccess;