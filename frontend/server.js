const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const net = require('net');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = process.env.PORT || 4000;
const CPP_SERVER_HOST = process.env.CPP_SERVER_HOST || 'localhost';
const CPP_SERVER_PORT = process.env.CPP_SERVER_PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

// Store active TCP connections in a Map (keyed by WebSocket)
const connections = new Map();

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket proxy server');
  const tcpClient = new net.Socket();

  tcpClient.connect(CPP_SERVER_PORT, CPP_SERVER_HOST, () => {
    console.log(`Connected to C++ server at ${CPP_SERVER_HOST}:${CPP_SERVER_PORT}`);
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      message: `Connected to server at ${CPP_SERVER_HOST}:${CPP_SERVER_PORT}`
    }));
  });

  let buffer = '';
  tcpClient.on('data', (data) => {
    const dataStr = data.toString();
    console.log('Received response from C++ server:', dataStr);
    buffer += dataStr;
    const messages = buffer.split('\n');
    buffer = messages.pop(); // Keep incomplete part

    messages.forEach((message) => {
      if (message.trim()) {
        const msgObj = {
          type: 'server',
          response: message.trim()
        };
        broadcast(JSON.stringify(msgObj));
      }
    });
  });

  tcpClient.on('error', (err) => {
    console.error('TCP connection error:', err.message);
    ws.send(JSON.stringify({
      type: 'error',
      message: `Error connecting to server: ${err.message}`
    }));
    if (tcpClient) {
      tcpClient.destroy();
    }
  });

  tcpClient.on('close', () => {
    console.log('TCP connection closed');
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'disconnected',
        message: 'Server connection closed'
      }));
    }
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'command') {
        console.log('Received command from client:', data.command);
        if (tcpClient && tcpClient.writable) {
          tcpClient.write(data.command + '\n');
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Cannot send command: Not connected to C++ server'
          }));
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    if (tcpClient && tcpClient.writable) {
      tcpClient.write('EXIT\n');
    }
    if (tcpClient) {
      tcpClient.destroy();
    }
    connections.delete(ws);
  });

  connections.set(ws, tcpClient);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Forwarding to C++ server at ${CPP_SERVER_HOST}:${CPP_SERVER_PORT}`);
});
