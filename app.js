import { readFileSync } from 'fs';
import dataService from "./src/services/inews-service.js";
import routes from "./src/routes/routes.js"
import express from "express";


// Read the configuration data from the local file
const configFilePath = './config.json';
const config = JSON.parse(readFileSync(configFilePath, 'utf8'));

const app = express(); 
app.use("/api", routes);

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    
    console.log(`REST API Service running on port ${port}`);
    dataService.startMainProcess(config);

});