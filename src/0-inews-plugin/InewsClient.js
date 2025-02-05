import EventEmitter from "events";
import InewsConnectionClient from "./InewsConnectionClient.js";
import NestedMap from "./NestedMap.js";
import logger from "../utilities/logger.js";

class InewsClient extends EventEmitter {
	
	constructor(config = {}) {
		super();
		this._connectionClients = new Set();
		this._connectionClientTimeouts = new Map();
		this._pendingRequestConnectionClients = new NestedMap();

		this.config = Object.assign({
            maxConnections: 1,
			minConnections: 0,
            optimalConnectionJobs: 25,
            rotateHosts: true,
            connectionIdleTimeout: 60000, // 1 minute
			debug: false
        }, config);

		if(typeof this.config.maxConnections !== 'number' || this.config.maxConnections < 1)
		    throw new Error(`maxConnections must be larger than 1`);

        if(this.config.maxConnections < this.config.minConnections)
            throw new Error(`minConnections must be greater than or equal to maxConnections`);

        if(!Array.isArray(this.config.hosts) && typeof this.config.host === 'string')
            this.config.hosts = [this.config.host];

        if(!Array.isArray(this.config.hosts) || this.config.hosts.length === 0)
            throw new Error(`Missing hosts option`);
        if(!this.config.hasOwnProperty('user'))
            throw new Error(`Missing user option`);
        if(!this.config.hasOwnProperty('password'))
            throw new Error(`Missing password option`);
		
		// Global error handler for the InewsClient
		this.on('error', (error) => {
			logger(`[FTP] InewsClient FTP Error ${error.message}`, "red" );
		});
	}

	get connections() {
		return this._connectionClients.size;
	}

	get load() {
		return this.requests / (this.config.maxConnections * this.config.optimalConnectionJobs);
	}

	get requests() {
		let requests = 0;
		for(let connectionClient of this._connectionClients)
			requests += connectionClient.requests;
		return requests;
	}

	get queued() {
		let queued = 0;
		for(let connectionClient of this._connectionClients)
			queued += connectionClient.queued;
		return queued;
	}

	get running() {
		let running = 0;
		for(let connectionClient of this._connectionClients)
			running += connectionClient.running;
		return running;
	}

	list(directory) {
		const requestPath = ['list', directory];
		if(this._pendingRequestConnectionClients.has(requestPath)){
			return this._pendingRequestConnectionClients.get(requestPath).list(directory);
		}
		else {
			const connectionClient = this._optimalConnectionClient(directory);
			this._pendingRequestConnectionClients.set(requestPath, connectionClient);

			const ftpDirectory = directory === "" ? "/" : directory;

			return connectionClient.list(ftpDirectory).finally(() => {
				this._pendingRequestConnectionClients.delete(requestPath);
			});
		}
	}

	story(directory, file) {
		const requestPath = ['story', directory, file];
		if(this._pendingRequestConnectionClients.has(requestPath))
			return this._pendingRequestConnectionClients.get(requestPath).story(directory, file);
		else {
			const connectionClient = this._optimalConnectionClient(directory);
			this._pendingRequestConnectionClients.set(requestPath, connectionClient);
			return connectionClient.story(directory, file).finally(() => {
				this._pendingRequestConnectionClients.delete(requestPath);
			});
		}
	}

	storyNsml(directory, file) {
		const requestPath = ['story', directory, file];

		if(this._pendingRequestConnectionClients.has(requestPath))
			return this._pendingRequestConnectionClients.get(requestPath).storyNsml(directory, file);
		else {
			const connectionClient = this._optimalConnectionClient(directory);
			this._pendingRequestConnectionClients.set(requestPath, connectionClient);
			return connectionClient.storyNsml(directory, file).finally(() => {
				this._pendingRequestConnectionClients.delete(requestPath);
			});
		}
	}
	
	stor(command, data, directory) {
		const requestPath = ['stor', directory, command];
		if (this._pendingRequestConnectionClients.has(requestPath)) {
			return this._pendingRequestConnectionClients.get(requestPath).stor(command, data);
		} else {
			const connectionClient = this._optimalConnectionClient(directory);
			this._pendingRequestConnectionClients.set(requestPath, connectionClient);
			return connectionClient.stor(command, data).finally(() => {
				this._pendingRequestConnectionClients.delete(requestPath);
			});
		}
	}

	_optimalConnectionClient(directory) {
		/*
		Sort by number of jobs running decreasing
		Priority order:
		- Connection with directory as its last request where # of jobs < optimalConnectionJobs
		- Any connection where # of jobs < optimalConnectionJobs
		- New connection, if possible
		- Connection with directory as its last request whose load factor rounds to system load factor
		- Connection with least number of jobs
		 */

		let connectionClients = Array.from(this._connectionClients);

		connectionClients.sort((connectionClient1, connectionClient2) => {
			if(connectionClient1.requests > connectionClient2.requests)
				return -1;
			else if(connectionClient1.requests < connectionClient2.requests)
				return 1;
			return 0;
		});

		for(let connectionClient of connectionClients) {
			if(connectionClient.lastDirectory === directory && connectionClient.requests < this.config.optimalConnectionJobs)
				return connectionClient;
		}

		for(let connectionClient of connectionClients) {
			if(connectionClient.requests < this.config.optimalConnectionJobs)
				return connectionClient;
		}

		if(this.connections < this.config.maxConnections)
			return this._addConnectionClient();

		const totalLoad = this.load;
		for(let connectionClient of connectionClients) {
			const connectionLoad = connectionClient.requests / this.config.optimalConnectionJobs;
			if(connectionClient.lastDirectory === directory && Math.floor(connectionLoad) <= Math.floor(totalLoad))
				return connectionClient;
		}

		return connectionClients[(connectionClients.length - 1)]; // connection with fewest requests, from sorted list
    }

	_addConnectionClient() {
	    let hosts = this.config.hosts;
        if(this.config.rotateHosts) {
            const hostStartIndex = (typeof this._hostStartIndex === 'number') ? (this._hostStartIndex + 1) % hosts.length : 0;
            hosts = hosts.slice(hostStartIndex).concat(hosts.slice(0, hostStartIndex));
            this._hostStartIndex = hostStartIndex;
        }

        const connectionClient = new InewsConnectionClient(Object.assign({}, this.config, {hosts: hosts}));

		connectionClient.on('error', (error) => {
			this.emit('error', error);
		});

		connectionClient.on('queued', (queued) => {
			this.emit('queued', this.queued);
		});

		connectionClient.on('running', (running) => {
			this.emit('running', this.running);
		});

		connectionClient.on('requests', (requests) => {
			this.emit('requests', this.requests);

			if(requests > 0)
				this._deleteConnectionClientTimeout(connectionClient);
			else
				this._resetConnectionClientTimeout(connectionClient);
		});

		this._connectionClients.add(connectionClient);

		this.emit('connections', this.connections);

		return connectionClient;
    }

    async _deleteConnectionClient(connectionClient) {
		if(this._connectionClients.has(connectionClient) && (this.connections - 1) >= this.config.minConnections) {
			this._connectionClients.delete(connectionClient);
			await connectionClient.destroy();
			this.emit('connections', this.connections);
			this._debug(`Deleting connectionClient`)
		}
    }

	_deleteConnectionClientTimeout(connectionClient) {
		if(this._connectionClientTimeouts.has(connectionClient)) {
			clearTimeout(this._connectionClientTimeouts.get(connectionClient));
			this._connectionClientTimeouts.delete(connectionClient)
		}
	}

	_resetConnectionClientTimeout(connectionClient) {
		this._deleteConnectionClientTimeout(connectionClient);

		if(typeof this.config.connectionIdleTimeout === 'number' && this.config.connectionIdleTimeout > 0) {
			const connectionClientTimeout = setTimeout(() => {
				this._deleteConnectionClient(connectionClient);
			}, this.config.connectionIdleTimeout);
			this._connectionClientTimeouts.set(connectionClient, connectionClientTimeout);
		}
	}

	_debug() {
		if(this.config.debug)
			console.log.apply(console, [(new Date()).toISOString()].concat(Array.prototype.slice.call(arguments)));
	}

	static get FILETYPES() {
		return InewsConnectionClient.FILETYPES;
	}

}

export default InewsClient
