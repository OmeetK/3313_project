const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const net = require('net');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = process.env.PORT || 4000;
const CPP_SERVER_HOST = process.env.CPP_SERVER_HOST || 'localhost';
const CPP_SERVER_PORT = process.env.CPP_SERVER_PORT || 8080;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Store active connections
const connections = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket proxy server');

    // Create TCP connection to C++ server
    const tcpClient = new net.Socket();
    
    // Connect to C++ server
    tcpClient.connect(CPP_SERVER_PORT, CPP_SERVER_HOST, () => {
        console.log(`Connected to C++ server at ${CPP_SERVER_HOST}:${CPP_SERVER_PORT}`);
        ws.send(JSON.stringify({
            type: 'connection',
            status: 'connected',
            message: `Connected to server at ${CPP_SERVER_HOST}:${CPP_SERVER_PORT}`
        }));
    });
    
    // Buffer for incomplete messages
    let buffer = '';
    
    // Handle TCP responses from the C++ backend server
    tcpClient.on('data', (data) => {
        console.log('Received response from C++ server:', data.toString());
        ws.send(JSON.stringify({
            type: 'server',
            message: data.toString()
        }));
        
        // Add to buffer
        buffer += data.toString();
        
        // Process complete messages (assuming messages end with newline)
        const messages = buffer.split('\n');
        buffer = messages.pop(); // Keep the last incomplete message in the buffer
        
        // Send complete messages to the WebSocket client
        for (const message of messages) {
            if (message.trim()) {
                ws.send(JSON.stringify({
                    type: 'server',
                    message: message.trim()
                }));
            }
        }
    });
    
    // Handle TCP connection errors
    tcpClient.on('error', (err) => {
        console.error('TCP connection error:', err.message);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Error connecting to server: ${err.message}`
        }));
        
        // Clean up the TCP client
        if (tcpClient) {
            tcpClient.destroy();
        }
    });
    
    // Handle TCP connection close
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
    
    // Handle messages from WebSocket client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'command') {
                console.log('Received command from client:', data.command);

                if (tcpClient && tcpClient.writable) {
                    // Forward the command to the C++ backend server
                    console.log('Sending command to C++ server:', data.command);
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
    
    // Handle WebSocket close event
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        
        // Send EXIT command to cleanly disconnect from C++ server
        if (tcpClient && tcpClient.writable) {
            tcpClient.write('EXIT\n');
        }
        
        // Clean up TCP connection
        if (tcpClient) {
            tcpClient.destroy();
        }
        
        // Remove from connections map
        connections.delete(ws);
    });
    
    // Store connection for reference
    connections.set(ws, tcpClient);
});

// Main HTML route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
server.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
    console.log(`Forwarding to C++ server at ${CPP_SERVER_HOST}:${CPP_SERVER_PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down proxy server...');
    
    // Close all TCP connections
    for (const [ws, tcpClient] of connections.entries()) {
        if (tcpClient && tcpClient.writable) {
            tcpClient.destroy();
        }
        
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    }
    
    // Close the HTTP server
    server.close(() => {
        console.log('Proxy server shut down');
        process.exit(0);
    });
});