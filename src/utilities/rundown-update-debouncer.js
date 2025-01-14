import sqlService from "../services/sql-service.js";


class LastUpdateService {
    constructor() {
        this.debouncerTimeouts = new Map(); // Store timeouts for each rundownStr
    }

    triggerRundownUpdate(rundownStr) {
        if (this.debouncerTimeouts.has(rundownStr)) {
            clearTimeout(this.debouncerTimeouts.get(rundownStr));
        }

        const timeout = setTimeout(() => {
            this.executeUpdate(rundownStr);
        }, 1000); 

        this.debouncerTimeouts.set(rundownStr, timeout);
    }

    async executeUpdate(rundownStr) {
        try {
            await sqlService.rundownLastUpdate(rundownStr, "rundownUpdateDebouncer"); 
        } catch (error) {
            console.error('Error executing update:', error);
        } finally {
            this.debouncerTimeouts.delete(rundownStr);
        }
    }
}

const lastUpdateService = new LastUpdateService();

export default lastUpdateService;
