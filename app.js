import dataService from "./src/services/inews-service.js";
import routes from "./src/routes/routes.js"
import express from "express";
import cors from "cors";
import xmlparser from "express-xml-bodyparser"; // Import express-xml-bodyparser

const app = express(); 

app.use(cors());

//app.use(xmlparser());
app.use("/api", routes);
app.use(express.static('plugin'));

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`REST API Service running on port ${port}`);
    dataService.startMainProcess();
});