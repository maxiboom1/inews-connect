import { readFileSync } from 'fs';

const appConfig =JSON.parse(readFileSync('./config.json', 'utf8'));
appConfig.version = "2.0.8";
export default appConfig;