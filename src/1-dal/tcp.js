import net from 'net';
import processor from '../services/inews-service.js';

const clients = [];

const server = net.createServer(socket => {
  let buffer = Buffer.alloc(0);

  socket.on('data', data => {
    buffer = Buffer.concat([buffer, data]);

    let index;
    while ((index = buffer.indexOf(0)) !== -1) {
      const command = buffer.slice(0, index).toString();
      buffer = buffer.slice(index + 1);
      handleCommand(socket, command.trim());
    }
  });

  socket.on('end', () => {
    const index = clients.indexOf(socket);
    if (index > -1) clients.splice(index, 1);
  });

  clients.push(socket);
});

server.listen(5431, () => {
  console.log('[TCP] Server listening on port 5431');
});

async function handleCommand(socket, cmd) {
  console.log('[TCP] Received:', cmd);

  if (cmd.startsWith('iNewsC-reset-')) {
    const uid = cmd.split('-')[2];
    const result = await processor.resetRundownByUid(uid);
    if (result.ok) {
      socket.write(`iNewsC-reset-${uid}-OK\0`);
    } else {
      socket.write(`iNewsC-reset-${uid}-${result.error}\0`);
    }

  } else if (cmd.startsWith('iNewsC-load-')) {
    const uid = cmd.split('-')[2];
    // Optionally track subscriptions
    socket.write(`iNewsC-load-${uid}-OK\0`);

  } else if (cmd.startsWith('iNewsC-unload-')) {
    const uid = cmd.split('-')[2];
    // Optionally remove subscription
    socket.write(`iNewsC-unload-${uid}-OK\0`);

  } else {
    socket.write(`iNewsC-status-ERROR-Unknown command\0`);
  }
}

export function shutdownAllClients() {
  for (const socket of clients) socket.end();
}
