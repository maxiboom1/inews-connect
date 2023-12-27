import inewsService from "./src/services/inews-service.js";
import routes from "./src/routes/routes.js";
import express from "express";
import cors from "cors";
import getServerIP from "./src/utilities/host-ip.js";

const app = express(); 

app.use(cors());
app.use(express.json()); 
app.use("/api",routes);

// Static server http://localhost:3000/plugin
app.use(express.static('plugin')); 

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    const host = getServerIP();
    console.log(`Server service running on port ${port}`);
    console.log(`Plugin url: http://${host}:${port}/index.html`)
    
    inewsService.startMainProcess();
});