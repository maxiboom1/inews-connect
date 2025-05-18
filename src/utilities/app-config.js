import { readFileSync } from 'fs';

const appConfig =JSON.parse(readFileSync('./config.json', 'utf8'));


// ************* Advanced application configuration *************
appConfig.version = "3.2.1"; 
appConfig.pullInterval = 1000;  
appConfig.ftpSiteFormat = "2nsml";
appConfig.conn.maxConnections = 1;
appConfig.pluginPort = 3000;
export default appConfig;