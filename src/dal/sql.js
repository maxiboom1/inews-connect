import mysql from "mysql";
import appConfig from "../utilities/app-config.js";

const connection = mysql.createPool({
    host: appConfig.mySqlHost,
    user: appConfig.mySqlUser,
    password: appConfig.mySqlPassword,
    database: appConfig.mySqlDatabase
});

//Execute any sql: 
function execute(sql, values){

    // Promisify:
    return new Promise((resolve, reject) => {

        // Execute query in database:
        connection.query(sql, values, (err, result) => {

            // If query failed:
            if(err) {
                reject(err);
                return;
            }

            // Query succeeded:
            resolve(result);

        });
    });
}



export default {
    execute
};