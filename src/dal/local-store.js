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
                await this.resetDB(lineup);
                console.log(`Lineup ${lineup} initialized in the database.`);
            }
            
        } 
        catch (error) {
            console.error('Error initializing lineup (check localStore):', error);
            throw error;
        }
    }

    async saveStory(lineup, index, story) {
        this.lineupStore[lineup][index] = { ...story };
        await this.addItemToDatabase(lineup,story);
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

    // -----------     SQL Functions    --------------
    
    // Clear db table
    async resetDB(lineup) {
        try {
            
            // Create table with lineup name (if not exists)
            await this.createLineupTable(lineup);

            // Reset the table
            const sql = `DELETE FROM ${lineup.replace(/\./g, '_').replace(/:/g, '')}`;
            const result = await db.execute(sql);
            console.log('DB cleaned!');
            return result;
        } catch (error) {
            console.error('Error resetting database:', error);
            throw error;
        }
    }
    // Add/Update db story
    async addItemToDatabase(lineup,storyData) {
        try {
            const sql = `
                INSERT INTO ${lineup.replace(/\./g, '_').replace(/:/g, '')} 
                (storyName, storyIndex, fileName, locator, modified, floated, cues, attachments, body, meta, storyId) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                storyName = VALUES(storyName),
                storyIndex = VALUES(storyIndex),
                fileName = VALUES(fileName),
                locator = VALUES(locator),
                modified = VALUES(modified),
                floated = VALUES(floated),
                cues = VALUES(cues),
                attachments = VALUES(attachments),
                body = VALUES(body),
                meta = VALUES(meta),
                storyId = VALUES(storyId)
            `;

            const values = [
                storyData.storyName,
                storyData.index,
                storyData.fileName,
                storyData.locator,
                storyData.modified,
                storyData.floated,
                JSON.stringify(storyData.cues),
                JSON.stringify(storyData.attachments),
                storyData.body,
                JSON.stringify(storyData.meta),
                storyData.id
            ];
    
            const result = await db.execute(sql, values);
            return result;
        } catch (error) {
            console.error('Error adding/updating item:', error);
            throw error;
        }
    }
    // Delete stories from db
    async deleteDbStories(lineup,newLength) {
        try {
            const sql = `DELETE FROM ${lineup.replace(/\./g, '_').replace(/:/g, '')} WHERE storyIndex >= ${newLength};`;
            const result = await db.execute(sql);
            return result;
        } catch (error) {
            console.error('Error deleting stories from database:', error);
            throw error;
        }
    }

    async createLineupTable(lineup) {
        try {
            
            const sql = `
                CREATE TABLE IF NOT EXISTS ${lineup.replace(/\./g, '_').replace(/:/g, '')} (
                    storyName varchar(500) NOT NULL,
                    storyIndex int(11) NOT NULL,
                    fileName varchar(30) NOT NULL,
                    locator varchar(30) NOT NULL,
                    modified varchar(30) NOT NULL,
                    floated varchar(10) NOT NULL,
                    cues varchar(500) NOT NULL,
                    attachments varchar(2000) NOT NULL,
                    body varchar(5000) NOT NULL,
                    meta varchar(500) NOT NULL,
                    storyId varchar(30) NOT NULL,
                    PRIMARY KEY (storyIndex)
                )
            `;
            const result = await db.execute(sql);
            console.log(`Table ${lineup} created in the database.`);
            return result;
        } catch (error) {
            console.error(`Error creating table for ${lineup} lineup:`, error);
            throw error;
        }
    }
}

const lineupStore = new LineupStore();

export default lineupStore;
