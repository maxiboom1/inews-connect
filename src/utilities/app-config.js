import { readFileSync } from 'fs';
import yaml from 'js-yaml';

//const appConfig =JSON.parse(readFileSync('./config.json', 'utf8'));
const fileContents = readFileSync('./config.yaml', 'utf8');
const appConfig = yaml.load(fileContents);
export default appConfig;