import appConfig from "../utilities/app-config.js";
import db from "../dal/sql.js"; // Make sure to import your database module

class LineupStore {
    constructor() {
        this.lineupStore = {};
        this.lineups = appConfig.lineups;
    }
    
    async onLoadInit(){
        try {
            for(let lineup of this.lineups){ 
                this.lineupStore[lineup] = [];
                await this.resetDBStories();
                await this.updateInewsRundowns(lineup);
                console.log(`Lineup ${lineup} initialized in the database..`);
            }
            
        } 
        catch (error) {
            console.error('Error initializing lineup (check localStore):', error);
            throw error;
        }
    }

    async saveStory(lineup, index, story) {
        const assertedUid = await this.addItemToDatabase(lineup,story,index);
        story.uid = assertedUid;
        this.lineupStore[lineup][index] = { ...story };
        
    }

    async deleteBasedLength(lineupName, newLength) {
        this.lineupStore[lineupName].length = newLength;
        await this.deleteDbStories(lineupName,newLength);
    }

    async getWatchedLineups(){
        return this.lineups;
    }

    async getLineup(lineup = this.activeLineup) { // By default, return active lineup
        return this.lineupStore[lineup];
    }

    async getStore() { // Returns store object as is (debugging)
        return this.lineupStore;
    }

    // -----------     SQL Functions    --------------
        
    // Update ngn_inews_rundowns with given lineup 
    async updateInewsRundowns(lineup) {
        if (typeof lineup !== 'string') {console.error('Invalid lineup value. It must be a string..');return;}
        const sqlQuery = `
        DECLARE @unixTimestamp BIGINT = DATEDIFF(SECOND, '1970-01-01', GETUTCDATE());
        DECLARE @outputTable TABLE (uid BIGINT);

        MERGE INTO ngn_inews_rundowns AS target
        USING (VALUES (@lineup)) AS source(name)
        ON target.name = source.name
        WHEN MATCHED THEN
        UPDATE SET lastupdate = @unixTimestamp
        WHEN NOT MATCHED THEN
        INSERT (name, lastupdate, production, enabled, exported, tag)
        VALUES (source.name, @unixTimestamp, 12, 1, 0, 'text')
        OUTPUT inserted.uid INTO @outputTable;

        SELECT uid FROM @outputTable;`;

        const values = { lineup: lineup };

        try {
            const result = await db.execute(sqlQuery, values);
            const uid = result[0].uid;
            this.lineupStore[lineup].uid = uid;
        } catch (error) {
            console.error('Error executing query:', error);
        }
    }
    
// Add db story and get asserted UID.
async addItemToDatabase(lineup, storyData, index) {
    const ordUpdate = true;
    const existingUid = this.lineupStore[lineup][index]?.uid || 1000000000000;
    const unixTimestamp = Math.floor(Date.now() / 1000);
    const name = storyData.storyName;
    const rundown = this.lineupStore[lineup].uid;

    // Use @name as the parameter placeholder
    const sqlQuery = `
        DECLARE @outputTable TABLE (uid BIGINT);
        MERGE INTO ngn_inews_stories AS target
        USING (VALUES (@existingUid, @name, @rundown, 1, @index, 1, 'tag')) AS source(uid, name, rundown, production, ord, enabled, tag)
        ON target.uid = source.uid
        WHEN MATCHED THEN
            UPDATE SET 
                name = source.name,
                lastupdate = @unixTimestamp,
                rundown = source.rundown,
                production = source.production,
                ord = source.ord,
                ${ordUpdate ? 'ordupdate = ' + '@unixTimestamp' : ''}, 
                enabled = source.enabled,
                tag = source.tag
        WHEN NOT MATCHED THEN
            INSERT (name, lastupdate, rundown, production, ord, ordupdate, enabled, tag)
            VALUES (@name, @unixTimestamp, @rundown, 1, @index, @unixTimestamp, 1, 'tag')
            OUTPUT inserted.uid INTO @outputTable;
        SELECT uid FROM @outputTable;
    `;

    // Define parameters as an object
    const params = {
        existingUid,
        name,
        rundown,
        index,
        unixTimestamp,
    };

    // Execute the query with parameters
    try {
        const result = await db.execute(sqlQuery, params);
        return result[0].uid;
    } catch (error) {
        console.error('Error executing query:', error);
        return null;
    }
}


    // Delete stories by length
    async deleteDbStories(rundown, length) {
        console.log(this.lineupStore[rundown].uid, length)
        try {
            const sql = `
                DELETE FROM ngn_inews_stories
                WHERE rundown = '${this.lineupStore[rundown].uid}' AND ord > ${length-1};
            `;
            const result = await db.execute(sql);
            return result;
        } catch (error) {
            console.error('Error deleting stories from SQL:', error);
            throw error;
        }
    }
    
    // Reset ngn_inews_stories
    async resetDBStories() {
        try {
            const sql = `DELETE FROM ngn_inews_stories`;
            await db.execute(sql);
        } catch (error) {
            console.error('Error deleting stories from SQL:', error);
            throw error;
        }
    }


}


const lineupStore = new LineupStore();

export default lineupStore;