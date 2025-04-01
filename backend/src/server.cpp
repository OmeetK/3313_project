#include <iostream>
#include <string>
#include <thread>
#include <vector>
#include <mutex>
#include <unordered_map>
#include <queue>
#include <condition_variable>
#include <atomic>
#include <sstream>
#include <chrono>
#include <fstream>
#include "database.h"
#include "user.h"

// Platform-specific socket headers
#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #pragma comment(lib, "ws2_32.lib")
    typedef SOCKET socket_t;
    #define CLOSE_SOCKET closesocket
    #define SOCKET_ERROR_CODE WSAGetLastError()
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <unistd.h>
    #include <arpa/inet.h>
    #include <netdb.h>
    typedef int socket_t;
    #define INVALID_SOCKET -1
    #define SOCKET_ERROR -1
    #define CLOSE_SOCKET close
    #define SOCKET_ERROR_CODE errno
#endif

// Database instance
std::unique_ptr<Database> g_db;

// Session for each connected client
class ClientSession {
public:
    ClientSession(socket_t clientSocket, Database& db)
        : socket(clientSocket), database(db), 
          authenticated(false), running(true) {}
    
    void handleClient() {
        char buffer[1024];
        int bytesReceived;
        
        // Send welcome message
        std::string welcome = "Welcome to the Transaction Server\nPlease login with 'LOGIN username password' or register with 'REGISTER username password'\n";
        send(socket, welcome.c_str(), welcome.size(), 0);
        
        while (running) {
            memset(buffer, 0, sizeof(buffer));
            bytesReceived = recv(socket, buffer, 1024, 0);
            
            if (bytesReceived <= 0) {
                // Client disconnected or error
                break;
            }
            
            std::string message(buffer);
            std::string response = processCommand(message);
            
            // Send response
            send(socket, response.c_str(), response.size(), 0);
        }
        
        CLOSE_SOCKET(socket);
    }
    
private:
    socket_t socket;
    Database& database;
    bool authenticated;
    bool running;
    std::string username;
    int currentTransaction = -1;
    
    std::string processCommand(const std::string& command) {
        std::istringstream iss(command);
        std::string cmd;
        iss >> cmd;
        
        // Convert command to uppercase for case-insensitive comparison
        for (auto& c : cmd) {
            c = toupper(c);
        }
        
        if (cmd == "LOGIN") {
            std::string username, password;
            iss >> username >> password;
        
            User user(database);
            int userId = user.authenticateUser(username, password);
            if (userId != -1) {
                this->authenticated = true;
                this->username = username;
                return "Login successful!\n";
            } else {
                return "Invalid username or password.\n";
            }
        }
        
        // Register new user
        if (cmd == "REGISTER") {
            std::string username, email, password;
            iss >> username >> email >> password;

            User user(database);
            if (user.createUser(username, email, password)) {
                return "Registration successful!\n";
            } else {
                return "Username already exists or registration failed.\n";
            }
        }
        // All other commands require authentication
        if (!authenticated) {
            return "Please login first.\n";
        }
        
        // Transaction commands commented out for now
        // if (cmd == "BEGIN") {
        //     if (currentTransaction != -1) {
        //         return "You already have an active transaction.\n";
        //     }
            
        //     currentTransaction = database.beginTransaction(username);
        //     if (currentTransaction != -1) {
        //         return "Transaction " + std::to_string(currentTransaction) + " started.\n";
        //     } else {
        //         return "Failed to start transaction.\n";
        //     }
        // }
        
        // if (cmd == "EXECUTE") {
        //     if (currentTransaction == -1) {
        //         return "No active transaction. Begin one with BEGIN command.\n";
        //     }
            
        //     std::string operation;
        //     std::getline(iss, operation);
        //     operation = operation.substr(operation.find_first_not_of(" \t")); // Trim leading whitespace
            
        //     if (database.executeOperation(currentTransaction, operation)) {
        //         return "Operation executed successfully.\n";
        //     } else {
        //         return "Operation failed!\n";
        //     }
        // }
        
        // if (cmd == "COMMIT") {
        //     if (currentTransaction == -1) {
        //         return "No active transaction to commit.\n";
        //     }
            
        //     int transId = currentTransaction;
        //     currentTransaction = -1;
            
        //     if (database.commitTransaction(transId)) {
        //         return "Transaction " + std::to_string(transId) + " committed successfully.\n";
        //     } else {
        //         return "Failed to commit transaction " + std::to_string(transId) + ".\n";
        //     }
        // }
        
        // if (cmd == "ROLLBACK") {
        //     if (currentTransaction == -1) {
        //         return "No active transaction to rollback.\n";
        //     }
            
        //     int transId = currentTransaction;
        //     currentTransaction = -1;
            
        //     if (database.rollbackTransaction(transId)) {
        //         return "Transaction " + std::to_string(transId) + " rolled back.\n";
        //     } else {
        //         return "Failed to rollback transaction " + std::to_string(transId) + ".\n";
        //     }
        // }
        
        if (cmd == "EXIT" || cmd == "QUIT") {
            running = false;
            return "Goodbye!\n";
        }
        
        return "Unknown command. Available commands: BEGIN, EXECUTE, COMMIT, ROLLBACK, EXIT\n";
    }
};

// Server class
class TransactionServer {
public:
    TransactionServer(int port, Database& db) : port(port), database(db), running(false) {}
    
    bool start() {
        // Initialize socket library on Windows
        #ifdef _WIN32
        WSADATA wsaData;
        if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
            std::cerr << "WSAStartup failed" << std::endl;
            return false;
        }
        #endif
        
        // Create socket
        serverSocket = socket(AF_INET, SOCK_STREAM, 0);
        if (serverSocket == INVALID_SOCKET) {
            std::cerr << "Error creating socket: " << SOCKET_ERROR_CODE << std::endl;
            return false;
        }
        
        // Set up address structure
        sockaddr_in serverAddr;
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;
        serverAddr.sin_port = htons(port);
        
        // Bind socket
        if (bind(serverSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
            std::cerr << "Bind failed: " << SOCKET_ERROR_CODE << std::endl;
            CLOSE_SOCKET(serverSocket);
            return false;
        }
        
        // Listen for connections
        if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
            std::cerr << "Listen failed: " << SOCKET_ERROR_CODE << std::endl;
            CLOSE_SOCKET(serverSocket);
            return false;
        }
        
        running = true;
        std::cout << "Server started on port " << port << std::endl;
        return true;
    }
    
    void run() {
        std::thread acceptThread(&TransactionServer::acceptConnections, this);
        
        // Wait for quit command
        std::string command;
        while (running) {
            std::cin >> command;
            if (command == "quit" || command == "exit") {
                running = false;
            }
        }
        
        // Clean up
        CLOSE_SOCKET(serverSocket);
        
        #ifdef _WIN32
        WSACleanup();
        #endif
        
        // Wait for the accept thread to finish
        if (acceptThread.joinable()) {
            acceptThread.join();
        }
        
        // Wait for all client threads to finish
        for (auto& thread : clientThreads) {
            if (thread.joinable()) {
                thread.join();
            }
        }
    }
    
private:
    int port;
    socket_t serverSocket;
    bool running;
    Database& database;
    std::vector<std::thread> clientThreads;
    
    void acceptConnections() {
        while (running) {
            // Accept a client connection
            sockaddr_in clientAddr;
            socklen_t clientAddrSize = sizeof(clientAddr);
            
            socket_t clientSocket = accept(serverSocket, (struct sockaddr*)&clientAddr, &clientAddrSize);
            
            if (clientSocket == INVALID_SOCKET) {
                if (!running) break;  // Server is shutting down
                std::cerr << "Accept failed: " << SOCKET_ERROR_CODE << std::endl;
                continue;
            }
            
            // Get client IP
            char clientIP[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, &(clientAddr.sin_addr), clientIP, INET_ADDRSTRLEN);
            std::cout << "New connection from " << clientIP << ":" << ntohs(clientAddr.sin_port) << std::endl;
            
            // Create a session for this client
            ClientSession* session = new ClientSession(clientSocket, database);
            
            // Handle this client in a new thread
            clientThreads.push_back(std::thread([session]() {
                session->handleClient();
                delete session;
            }));
            
            // Detach the thread so it can run independently
            clientThreads.back().detach();
        }
    }
};

int main(int argc, char* argv[]) {
    // Default configuration
    int port = 8080;
    std::string connection_string = "postgresql://neondb_owner:npg_myZ1LbsMtSN2@ep-quiet-waterfall-a5ug6jn4-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";
    
    // Parse command line arguments (if any)
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "--port" && i + 1 < argc) {
            port = std::stoi(argv[++i]);
        } else if (arg == "--db" && i + 1 < argc) {
            connection_string = argv[++i];
        }
    }
    
    // Create and initialize database connection
    g_db = std::make_unique<Database>(connection_string);
    if (!g_db->initialize()) {
        std::cerr << "Failed to initialize database" << std::endl;
        return 1;
    }
    
    // Create and start the server
    TransactionServer server(port, *g_db);
    
    if (server.start()) {
        std::cout << "Server is running. Press 'quit' or 'exit' to stop the server." << std::endl;
        server.run();
    } else {
        std::cerr << "Failed to start server" << std::endl;
        return 1;
    }
    
    return 0;
}