import net from 'net';
import { handleTcpMessage } from './tcp-router.js';
import logger from '../utilities/logger.js';

let server = null;

function startTcpServer() {
    server = net.createServer(socket => {
        let buffer = Buffer.alloc(0);

        socket.on('error', err => {});
        
        socket.on('data', data => {
            buffer = Buffer.concat([buffer, data]);
            let index;
            while ((index = buffer.indexOf(0)) !== -1) {
                const command = buffer.slice(0, index).toString();
                buffer = buffer.slice(index + 1);
                handleTcpMessage(socket, command.trim());
            }
        });

        socket.on('end', () => {logger(`[TCP] NA Client disconnected`);});

    });

    server.listen(5431, () => {
        logger('[TCP] Server listening on port 5431',"yellow");
    });
}

export { startTcpServer };
