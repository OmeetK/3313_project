//172.21.118.52
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
const CPP_SERVER_HOST = process.env.CPP_SERVER_HOST || '172.21.118.52';
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
    
    // Track last command sent and login status
    let lastCommand = '';
    let loggedIn = false;
    
    // Connect to C++ server
    tcpClient.connect(CPP_SERVER_PORT, CPP_SERVER_HOST, () => {
        console.log(`Connected to C++ server at ${CPP_SERVER_HOST}:${CPP_SERVER_PORT}`);
        
        // Send connection confirmation to client
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
        const responseData = data.toString();
        console.log('Received raw response from C++ server:', responseData);
        
        // Direct handling of login successful response
        if (responseData.includes('Login successful')) {
            // Extract token
            const tokenMatch = responseData.match(/TOKEN:(\S+)/);
            const token = tokenMatch ? tokenMatch[1] : null;
            
            // Send comprehensive login response
            const loginResponse = {
                type: 'server',
                status: 'success',
                response: 'Login successful',
                message: responseData,
                token: tokenMatch ? tokenMatch[1] : null
            };
            
            console.log('Sending login response:', loginResponse);
            ws.send(JSON.stringify(loginResponse));
            
            loggedIn = true;
            return;
        }
        
        // Add to buffer
        buffer += responseData;
        
        // Process buffered messages
        try {
            // Try to parse as JSON first
            const jsonData = JSON.parse(buffer);
            
            // If successful, send as server message
            ws.send(JSON.stringify({
                type: 'server',
                message: jsonData,
                response: buffer.trim()
            }));
            
            // Clear buffer
            buffer = '';
        } catch (e) {
            // Not complete JSON or not JSON format
            const messages = buffer.split('\n');
            
            // Keep potential incomplete message in buffer
            buffer = messages.pop() || '';
            
            // Process complete messages
            messages.forEach(message => {
                if (message.trim()) {
                    try {
                        // Try to parse as JSON
                        const jsonData = JSON.parse(message.trim());
                        ws.send(JSON.stringify({
                            type: 'server',
                            message: jsonData,
                            response: message.trim()
                        }));
                    } catch {
                        // Send as text message if not JSON
                        ws.send(JSON.stringify({
                            type: 'server',
                            message: message.trim(),
                            response: message.trim()
                        }));
                    }
                }
            });
        }
    });
    
    // Handle WebSocket messages from client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'command') {
                const command = data.command;
                lastCommand = command;
                
                console.log('Sending command to C++ server:', command);
                
                if (tcpClient && tcpClient.writable) {
                    tcpClient.write(command + '\n');
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
    
    // Handle connection errors
    tcpClient.on('error', (err) => {
        console.error('TCP connection error:', err.message);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Error connecting to server: ${err.message}`
        }));
    });
    
    // Handle connection close
    tcpClient.on('close', () => {
        console.log('TCP connection closed');
        ws.send(JSON.stringify({
            type: 'connection',
            status: 'disconnected',
            message: 'Server connection closed'
        }));
    });
    
    // Handle WebSocket close
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        
        // Clean up TCP connection
        if (tcpClient) {
            tcpClient.write('EXIT\n');
            tcpClient.destroy();
        }
        
        connections.delete(ws);
    });
    
    // Store connection for reference
    connections.set(ws, tcpClient);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
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