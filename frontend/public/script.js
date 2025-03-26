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
    const port = serverPortInput.value || '8080';
    
    if (isConnected) {
        socket.close();
        isConnected = false;
    }
    
    connectionStatus.textContent = 'Connecting...';
    
    try {
        // For a real implementation, you would use WebSockets
        // For this demo, we'll simulate the connection
        setTimeout(() => {
            isConnected = true;
            connectionStatus.textContent = 'Connected to server';
            
            // Show authentication panel
            connectionPanel.classList.add('hidden');
            authPanel.classList.remove('hidden');
            
            // Log welcome message
            addLog('SERVER', 'Welcome to the Transaction Server');
            addLog('SERVER', 'Please login with LOGIN username password or register with REGISTER username password');
        }, 1000);
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
        // For demo, accept admin/admin123 and user1/password1
        if ((username === 'admin' && password === 'admin123') || 
            (username === 'user1' && password === 'password1')) {
            isAuthenticated = true;
            currentUsername = username;
            
            addLog('SERVER', 'Login successful!');
            
            // Show transaction panel
            authPanel.classList.add('hidden');
            transactionPanel.classList.remove('hidden');
            usernameDisplay.textContent = username;
        } else {
            addLog('SERVER', 'Invalid username or password.');
        }
    }, 500);
}

function register() {
    const username = regUsernameInput.value;
    const password = regPasswordInput.value;
    
    if (!username || !password) {
        addLog('ERROR', 'Please enter both username and password');
        return;
    }
    
    // Send register command
    const command = `REGISTER ${username} ${password}`;
    addLog('COMMAND', command);
    
    // Simulate server response
    setTimeout(() => {
        addLog('SERVER', 'Registration successful!');
        switchTab('login');
    }, 500);
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