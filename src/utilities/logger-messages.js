import timeMeasure from "./time-measure.js";
import logger from "./logger.js";
import appConfig from "./app-config.js";
import getServerIP from "./host-ip.js";

class Messages {

    appLoadedMessage(rundowns){
        const host = getServerIP();
        //console.clear();
        logger(`**********************************************************************`,"blue");
        logger(`[SYSTEM] Inews-Connect, App Version: ${appConfig.version}, loaded in ${timeMeasure.end()} seconds`,"green");
        logger(`[SYSTEM] Plugin url: http://${host}:${appConfig.pluginPort}/index.html`,"green")
        logger(`[SYSTEM] Now watching on:`,"green");
        let i = 1;
        for (const rundownStr of rundowns) {
            logger(`[SYSTEM] ${i}: ${rundownStr}`,"green");
            i++;
        }
        
        logger(`**********************************************************************`,"blue");
    }

}

const logMessages = new Messages();

export default logMessages;
