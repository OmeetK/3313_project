// Global state
let socket = null;
let isConnected = false;
let isAuthenticated = false;
let currentTransaction = null;
let currentUsername = '';

// DOM elements
const connectionPanel = document.getElementById('connection-panel');
const authPanel = document.getElementById('auth-panel');
const transactionPanel = document.getElementById('transaction-panel');
const logContainer = document.getElementById('log-container');

// Connection elements
const serverAddressInput = document.getElementById('server-address');
const serverPortInput = document.getElementById('server-port');
const connectBtn = document.getElementById('connect-btn');
const connectionStatus = document.getElementById('connection-status');

// Auth elements
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const regUsernameInput = document.getElementById('reg-username');
const regPasswordInput = document.getElementById('reg-password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');

// Transaction elements
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');
const beginBtn = document.getElementById('begin-btn');
const commitBtn = document.getElementById('commit-btn');
const rollbackBtn = document.getElementById('rollback-btn');
const operationInput = document.getElementById('operation');
const executeBtn = document.getElementById('execute-btn');
const transactionIdDisplay = document.getElementById('transaction-id');

// Log elements
const clearLogBtn = document.getElementById('clear-log-btn');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Connection
    connectBtn.addEventListener('click', connectToServer);
    
    // Auth
    loginBtn.addEventListener('click', login);
    registerBtn.addEventListener('click', register);
    
    // Transaction
    logoutBtn.addEventListener('click', logout);
    beginBtn.addEventListener('click', beginTransaction);
    commitBtn.addEventListener('click', commitTransaction);
    rollbackBtn.addEventListener('click', rollbackTransaction);
    executeBtn.addEventListener('click', executeOperation);
    
    // Logs
    clearLogBtn.addEventListener('click', clearLogs);
});

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-content`).classList.add('active');
}

// Connect to server
function connectToServer() {
    const address = serverAddressInput.value || 'localhost';
    const port = serverPortInput.value || '4000'; // Proxy server port

    if (isConnected) {
        socket.close();
        isConnected = false;
    }

    connectionStatus.textContent = 'Connecting...';

    try {
        // Create a new WebSocket connection to the proxy server
        socket = new WebSocket(`ws://${address}:${port}`);

        // Handle WebSocket open event
        socket.onopen = () => {
            isConnected = true;
            connectionStatus.textContent = 'Connected to proxy server';

            // Show authentication panel
            connectionPanel.classList.add('hidden');
            authPanel.classList.remove('hidden');

            // Log welcome message
            addLog('SERVER', 'Connected to the WebSocket proxy server');
        };

        // Handle WebSocket message event
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'server') {
                addLog('SERVER', data.message);
            } else if (data.type === 'error') {
                addLog('ERROR', data.message);
            }
        };

        // Handle WebSocket close event
        socket.onclose = () => {
            isConnected = false;
            connectionStatus.textContent = 'Disconnected from proxy server';
            connectionPanel.classList.remove('hidden');
            authPanel.classList.add('hidden');
            transactionPanel.classList.add('hidden');
        };

        // Handle WebSocket error event
        socket.onerror = (error) => {
            connectionStatus.textContent = `Connection error: ${error.message}`;
            isConnected = false;
        };
    } catch (error) {
        connectionStatus.textContent = `Connection failed: ${error.message}`;
        isConnected = false;
    }
}

// Authentication
function login() {
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    if (!username || !password) {
        addLog('ERROR', 'Please enter both username and password');
        return;
    }
    
    // Send login command
    const command = `LOGIN ${username} ${password}`;
    addLog('COMMAND', command);
    
    // Simulate server response
    setTimeout(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        } else {
            addLog('ERROR', 'WebSocket is not connected');
        }
    }, 500);
}

function register() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    if (!username || !email || !password) {
        addLog('ERROR', 'Please enter username, email, and password');
        return;
    }

    // Construct the JSON message
    const message = {
        type: 'command',
        command: `REGISTER ${username} ${email} ${password}`
    };

    addLog('COMMAND', message.command);

    // Send the JSON message to the WebSocket server
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    } else {
        addLog('ERROR', 'WebSocket is not connected');
    }
}

function logout() {
    // Send logout command
    addLog('COMMAND', 'EXIT');
    
    // Simulate server response
    setTimeout(() => {
        isAuthenticated = false;
        currentUsername = '';
        currentTransaction = null;
        
        addLog('SERVER', 'Goodbye!');
        
        // Reset UI
        transactionPanel.classList.add('hidden');
        authPanel.classList.remove('hidden');
        usernameInput.value = '';
        passwordInput.value = '';
        transactionIdDisplay.textContent = 'None';
        updateTransactionControls();
    }, 500);
}

// Transaction operations
function beginTransaction() {
    // Send begin command
    addLog('COMMAND', 'BEGIN');
    
    // Simulate server response
    setTimeout(() => {
        currentTransaction = Math.floor(Math.random() * 1000) + 1;
        addLog('SERVER', `Transaction ${currentTransaction} started.`);
        
        transactionIdDisplay.textContent = currentTransaction;
        updateTransactionControls();
    }, 500);
}

function commitTransaction() {
    if (!currentTransaction) return;
    
    // Send commit command
    addLog('COMMAND', 'COMMIT');
    
    // Simulate server response
    setTimeout(() => {
        addLog('SERVER', `Transaction ${currentTransaction} committed successfully.`);
        
        currentTransaction = null;
        transactionIdDisplay.textContent = 'None';
        operationInput.value = '';
        updateTransactionControls();
    }, 500);
}

function rollbackTransaction() {
    if (!currentTransaction) return;
    
    // Send rollback command
    addLog('COMMAND', 'ROLLBACK');
    
    // Simulate server response
    setTimeout(() => {
        addLog('SERVER', `Transaction ${currentTransaction} rolled back.`);
        
        currentTransaction = null;
        transactionIdDisplay.textContent = 'None';
        operationInput.value = '';
        updateTransactionControls();
    }, 500);
}

function executeOperation() {
    if (!currentTransaction) return;
    
    const operation = operationInput.value;
    
    if (!operation) {
        addLog('ERROR', 'Please enter an operation');
        return;
    }
    
    // Send execute command
    addLog('COMMAND', `EXECUTE ${operation}`);
    
    // Simulate server response
    setTimeout(() => {
        // Fail if operation contains "fail"
        if (operation.toLowerCase().includes('fail')) {
            addLog('SERVER', 'Operation failed!');
        } else {
            addLog('SERVER', 'Operation executed successfully.');
        }
    }, 500);
}

// Helper functions
function updateTransactionControls() {
    const hasTransaction = currentTransaction !== null;
    
    beginBtn.disabled = hasTransaction;
    commitBtn.disabled = !hasTransaction;
    rollbackBtn.disabled = !hasTransaction;
    operationInput.disabled = !hasTransaction;
    executeBtn.disabled = !hasTransaction;
}

function addLog(type, message) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    if (type === 'COMMAND') {
        logEntry.innerHTML = `<span class="log-command">&gt; ${message}</span>`;
    } else if (type === 'SERVER') {
        logEntry.innerHTML = `<span class="log-response">${message}</span>`;
    } else if (type === 'ERROR') {
        logEntry.innerHTML = `<span class="log-error">${message}</span>`;
    }
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function clearLogs() {
    logContainer.innerHTML = '';
}