import appConfig from "../utilities/app-config.js";
import db from "../dal/sql.js";

class SqlAccess {
    
    // Load lineup list from config.json
    constructor() {
        this.hardcodedLineupList= appConfig.lineups;
        this.lineupsWithUid = {};
    }

    async initialize(){
        try {
            for(let lineup of this.hardcodedLineupList){ 
                await this.resetDBStories();
                await this.updateInewsRundowns(lineup);
            }    
        } 
        catch (error) {
            throw error;
        }
    }

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
        INSERT (name, lastupdate, production, enabled, tag)
        VALUES (source.name, @unixTimestamp, 12, 1,'text')
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

const sqlAccess = new SqlAccess();

export default sqlAccess;