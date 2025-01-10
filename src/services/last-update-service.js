import sqlService from "./sql-service.js";


class LastUpdateService {
    constructor() {
        this.debouncerTimeouts = new Map(); // Store timeouts for each rundownStr
    }

    // Method to trigger the last update
    triggerRundownUpdate(rundownStr) {
        // Clear any existing timeout for this rundownStr
        if (this.debouncerTimeouts.has(rundownStr)) {
            clearTimeout(this.debouncerTimeouts.get(rundownStr));
        }

        // Set a new timeout for this rundownStr
        const timeout = setTimeout(() => {
            this.executeUpdate(rundownStr);
        }, 1000); // 1 second debounce

        // Store the timeout in the map
        this.debouncerTimeouts.set(rundownStr, timeout);
    }

    async executeUpdate(rundownStr) {
        try {
            await sqlService.rundownLastUpdate(rundownStr, "LastUpdateService"); 
        } catch (error) {
            console.error('Error executing update:', error);
        } finally {
            this.debouncerTimeouts.delete(rundownStr);
        }
    }
}

const lastUpdateService = new LastUpdateService();

export default lastUpdateService;
