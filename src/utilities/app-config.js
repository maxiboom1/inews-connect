import { readFileSync } from 'fs';

const appConfig =JSON.parse(readFileSync('./config.json', 'utf8'));


// ************* Advanced application configuration *************
appConfig.version = "2.1.0";
appConfig.pullInterval = 1000;  
appConfig.ftpSiteFormat = "2nsml";

export default appConfig;