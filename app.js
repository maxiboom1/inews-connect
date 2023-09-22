import dataService from "./src/services/inews-service.js";
import routes from "./src/routes/routes.js"
import express from "express";

const app = express(); 
app.use("/api", routes);

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {

    console.log(`REST API Service running on port ${port}`);
    dataService.startMainProcess();

});