class TimeMeasure {
    constructor() {
        this.startTime = 0;
    }

    start() {
        this.startTime = 0;
        this.startTime = performance.now();
    }

    end() {
        const endTime = performance.now();
        return ((endTime - this.startTime) / 1000).toFixed(2); // Convert to seconds
    }
}

export default new TimeMeasure();
