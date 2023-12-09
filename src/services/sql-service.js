import appConfig from "../utilities/app-config.js";
import db from "../dal/sql.js";

class SqlAccess {
    
    // Load lineup list from config.json
    constructor() {
        this.hardcodedLineupList = appConfig.rundowns;
    }

    // Reset stories and fills rundowns 
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
        } catch (error) {
            console.error('Error executing query:', error); 
        }

    }

    async reorderDbStory(story,ord){
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
        } catch (error) {
            console.error('Error executing query:', error);
        }

    }

    async deleteDBStories() {
        try {
            const sql = `DELETE FROM ngn_inews_stories`;
            await db.execute(sql);
        } catch (error) {
            console.error('Error deleting stories from SQL:', error);
            throw error;
        }
    }

    async deleteDBRundowns() {
        try {
            const sql = `DELETE FROM ngn_inews_rundowns`;
            await db.execute(sql);
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



/*

{
  fileType: 'STORY',
  fileName: '066B337E:0002E0E1:656B4145',
  identifier: '066B337E',
  locator: '0002E0E1:656B4145',
  storyName: 'new2',
  modified: 2023-12-02T07:37:00.000Z,
  flags: { floated: false }
} {
  fields: {},
  meta: { rate: '180', wordlength: '6', version: '2' },
  cues: [],
  attachments: {},
  formname: 'STORYFORM',
  id: '066b337e:0002e0e1:656b4145',
  body: ''
} 0

*/