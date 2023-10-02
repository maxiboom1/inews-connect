import dataService from "./src/services/inews-service.js";
import routes from "./src/routes/routes.js";
import pluginRoutes from "./src/routes/plugin-routes.js"
import express from "express";
import cors from "cors";

const app = express(); 

app.use(cors());

// Routes
app.use("/api", routes);
app.use(pluginRoutes);

// "plugin" here is an folder name that contain index.html to serve. The url will be: http://localhost:3000/plugin
app.use(express.static('plugin')); 

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`REST API Service running on port ${port}`);
    dataService.startMainProcess();
});