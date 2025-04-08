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
const CPP_SERVER_HOST = process.env.CPP_SERVER_HOST || '172.21.118.52'; // Keep your server IP
const CPP_SERVER_PORT = process.env.CPP_SERVER_PORT || 8080;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Store active connections
const connections = new Map();

// Helper function to try parsing JSON safely
function tryParseJSON(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        console.log('Failed to parse JSON:', str);
        return null;
    }
}

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
        
        // Check if we need to auto-login for certain commands
        if ((responseData.includes('Welcome to the') || 
             responseData.includes('Please login with') ||
             responseData.includes('Unknown command')) && 
            !loggedIn) {
            
            // Check if the last command was a GET_AUCTIONS or similar browsing command
            if (lastCommand && 
                (lastCommand.includes('GET_AUCTIONS') || 
                 lastCommand.startsWith('GET_'))) {
                
                console.log('Auto-logging in for testuser...');
                tcpClient.write('LOGIN testing test123\n');
                loggedIn = true;
                
                // Re-send the original command after login
                setTimeout(() => {
                    console.log('Re-sending command after auto-login:', lastCommand);
                    tcpClient.write(lastCommand + '\n');
                }, 100);
                
                // Don't send welcome/login message to client
                return;
            }
        }
        
        // If response contains "Login successful", update login status
        if (responseData.includes('Login successful')) {
            loggedIn = true;
            
            // Don't send login success message to client for auto-login
            if (lastCommand && lastCommand.startsWith('LOGIN')) {
                // This was an explicit login, send the response
                ws.send(JSON.stringify({
                    type: 'server',
                    message: responseData
                }));
            }
            return;
        }
        
        // Add to buffer
        buffer += responseData;
        
        // Try to parse as JSON first
        try {
            // If the buffer contains complete JSON, process it
            const jsonData = JSON.parse(buffer);
            console.log('Parsed JSON data from buffer:', jsonData);
            
            // Clear the buffer after successful parsing
            buffer = '';
            
            // Send the parsed JSON to the client
            ws.send(JSON.stringify({
                type: 'server',
                message: jsonData
            }));
            
        } catch (e) {
            // Not a complete JSON yet or not JSON format
            console.log('Buffer is not complete JSON yet or is text format');
            
            // Check if we have complete messages (assuming messages end with newline)
            const messages = buffer.split('\n');
            if (messages.length > 1) {
                // Keep the last potentially incomplete message in the buffer
                buffer = messages.pop();
                
                // Process complete messages
                for (const message of messages) {
                    if (message.trim()) {
                        // Try to parse as JSON first
                        try {
                            const jsonData = JSON.parse(message.trim());
                            ws.send(JSON.stringify({
                                type: 'server',
                                message: jsonData
                            }));
                        } catch (e) {
                            // Not JSON, send as text
                            ws.send(JSON.stringify({
                                type: 'server',
                                message: message.trim()
                            }));
                        }
                    }
                }
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
            console.log('Received WebSocket message:', data);
            
            if (data.type === 'command') {
                const command = data.command;
                lastCommand = command;
                
                console.log('Sending command to C++ server:', command);
                tcpClient.write(command + '\n');
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
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