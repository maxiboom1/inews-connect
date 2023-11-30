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
        this.lineupStore[lineup][index] = { ...story };
        //await this.addItemToDatabase(lineup,story,index);
    }

    async deleteBasedLength(lineupName, newLength) {
        this.lineupStore[lineupName].length = newLength;
        //await this.deleteDbStories(lineupName,newLength);
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
        // Ensure lineup is a valid string
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
    
    // Add/Update db story
    async addItemToDatabase(lineup, storyData, index) {
        try {
            const sql = `
                INSERT INTO ngn_inews_stories 
                (name, lastupdate, rundown, rundownname, production, ord, ordupdate, enabled, tag) 
                VALUES (
                    '${storyData.storyName}', 
                    UNIX_TIMESTAMP(NOW()) * 10000000, 
                    (SELECT uid FROM ngn_inews_rundowns WHERE name = '${lineup}'),
                    '${lineup}',
                    '0',
                    ${index}, 
                    UNIX_TIMESTAMP(NOW()) * 10000000, 
                    1, 
                    'tag'
                )
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    lastupdate = VALUES(lastupdate),
                    production = VALUES(production),
                    ordupdate = VALUES(ordupdate),
                    enabled = VALUES(enabled),
                    tag = VALUES(tag);
            `;
    
            const result = await db.execute(sql);
            await this.updateInewsRundowns(lineup);
            return result;
        } catch (error) {
            console.error('Error adding/updating item:', error);
            throw error;
        }
    }
    
    // Delete stories from db
    async deleteDbStories(lineup,newLength) {
        try {
            const sql = `
                DELETE FROM ngn_inews_stories
                WHERE rundownname = '${lineup}' AND ord > ${newLength};
            `;
    
            const result = await db.execute(sql);
            return result;
        } catch (error) {
            console.error('Error deleting stories from SQL:', error);
            throw error;
        }
    }

}


const lineupStore = new LineupStore();

export default lineupStore;