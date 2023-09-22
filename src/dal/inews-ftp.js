import Inews from '../inews-plugin/InewsClient.js';
import appConfig from '../utilities/app-config.js';

async function Conn(){
    const x = new Inews({ ...appConfig.conn });
    return x;
}

const conn = await Conn();

export default conn;