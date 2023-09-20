function logger(msg, err = false){
    if (err) {
        console.error(msg);
        // Write to log file etc...
    } else {
        console.log(msg);
    }
    
}

export default logger;