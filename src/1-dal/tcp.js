import net from 'net';
import { handleTcpMessage } from './tcp-router.js';
import processor from '../services/inews-service.js';
import logger from '../utilities/logger.js';

const clients = [];
let server = null;

function startTcpServer() {
    server = net.createServer(socket => {
        let buffer = Buffer.alloc(0);
        
        // Handle ECONNRESET and other socket errors
        socket.on('error', err => {
            logger(`[TCP] Client socket error: ${err.message}`,"red");
        });
        socket.on('data', data => {
            buffer = Buffer.concat([buffer, data]);

            let index;
            while ((index = buffer.indexOf(0)) !== -1) {
                const command = buffer.slice(0, index).toString();
                buffer = buffer.slice(index + 1);
                handleTcpMessage(socket, command.trim());
            }
        });

        socket.on('end', () => {
            const index = clients.indexOf(socket);
            if (index > -1) clients.splice(index, 1);

            if (socket.__subscribedUid) {
                processor.unsubscribeRundown(socket.__subscribedUid);
                logger(`[TCP] NA Client disconnected — unsubscribed from UID ${socket.__subscribedUid}`, "red");
            } else {
                logger(`[TCP] NA Client disconnected — no UID tracked`,"red");
            }
        });

        clients.push(socket);
    });

    server.listen(5431, () => {
        logger('[TCP] Server listening on port 5431',"yellow");
    });
}

function shutdownAllClients() {
    for (const socket of clients) socket.end();
}

export { startTcpServer, shutdownAllClients };
