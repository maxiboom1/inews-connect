import processor from "./src/services/inews-service.js";
import routes from "./src/routes/routes.js";
import express from "express";
import cors from "cors";
import bodyParser from 'body-parser';
import appConfig from "./src/utilities/app-config.js";
const app = express(); 

app.use(cors({origin: '*'}));

// Increase payload size limit to 50MB
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use("/api",routes);

// Static server http://localhost:3000/plugin
app.use(express.static('plugin')); 

// Start the Express server
app.listen(appConfig.pluginPort, () => {
    processor.startMainProcess();
});