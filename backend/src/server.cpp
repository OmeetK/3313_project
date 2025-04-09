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
#include <iomanip>
#include <pqxx/pqxx>
#include "database.h"
#include "user.h"
#include "auction.h"
#include "sell.h"

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

// JSON escape helper function; escapes quotes and control characters.
std::string escapeJsonString(const std::string &input) {
    std::ostringstream ss;
    for (char c : input) {
        switch (c) {
            case '\"': ss << "\\\""; break;
            case '\\': ss << "\\\\"; break;
            case '\b': ss << "\\b";  break;
            case '\f': ss << "\\f";  break;
            case '\n': ss << "\\n";  break;
            case '\r': ss << "\\r";  break;
            case '\t': ss << "\\t";  break;
            default:
                if (c >= '\x00' && c <= '\x1f') {
                    ss << "\\u" 
                       << std::hex << std::setw(4) << std::setfill('0') << (int)c;
                } else {
                    ss << c;
                }
        }
    }
    return ss.str();
}

class ClientSession {
public:
    ClientSession(socket_t clientSocket, Database& db)
        : socket(clientSocket), database(db), authenticated(false), running(true), userId(-1), currentTransaction(-1) {}

    void handleClient() {
        char buffer[1024];
        int bytesReceived;

        std::string welcome = "Welcome to the Transaction Server\n"
                              "Please login with 'LOGIN username password' or register with 'REGISTER username password'\n";
        send(socket, welcome.c_str(), welcome.size(), 0);

        while (running) {
            memset(buffer, 0, sizeof(buffer));
            bytesReceived = recv(socket, buffer, 1024, 0);
            if (bytesReceived <= 0) {
                // Client disconnected or error
                break;
            }

            std::string message(buffer);
            std::cout << "[ClientSession] Received: " << message << std::endl;
            std::string response = processCommand(message);
            std::cout << "[ClientSession] Response: " << response << std::endl;
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
    int userId;
    int currentTransaction;

    std::string processCommand(const std::string& command) {
        std::istringstream iss(command);
        std::string cmd;
        iss >> cmd;
        for (auto& c : cmd) {
            c = toupper(c);
        }

        if (cmd == "LOGIN") {
            std::string u, p;
            iss >> u >> p;
            User user(database);
            int uid = user.authenticateUser(u, p);
            if (uid != -1) {
                authenticated = true;
                username = u;
                userId = uid;
                std::string token = user.generateJWT(uid, u);
                return "Login successful! TOKEN:" + token + "\n";
            } else {
                return "Invalid username or password.\n";
            }
        }

        if (cmd == "REGISTER") {
            std::string u, email, p;
            iss >> u >> email >> p;
            User user(database);
            if (user.createUser(u, email, p)) {
                return "Registration successful!\n";
            } else {
                return "Username already exists or registration failed.\n";
            }
        }

        if (cmd == "CREATE_AUCTION") {
            int uid;
            std::string itemName, endTime;
            double startingPrice;
            if (!(iss >> uid)) {
                uid = 1;
            }
            // Read item name (quoted)
            if (iss.peek() == '"') {
                iss.get();
                std::getline(iss, itemName, '"');
            } else {
                iss >> itemName;
            }
            iss >> startingPrice >> endTime;

            Auction auction(database);
            int newId = auction.createAuction(uid, itemName, startingPrice, endTime, 1);
            if (newId > 0) {
                return "Auction created successfully for item: " + itemName +
                       " with auction_id = " + std::to_string(newId) + "\n";
            } else {
                return "Failed to create auction.\n";
            }
        }

        if (cmd == "CREATE_LISTING") {
            std::string itemName, startingPrice, endTime;
            int categoryIdInt = 1;
        
            // Step 1: User ID
            if (!authenticated || userId == -1) {
                return "Error: You must be logged in to create a listing.";
            }

            // Step 2: Item name until we hit $startingPrice
            std::string word;
            while (iss >> word) {
                if (!word.empty() && word[0] == '$') {
                    startingPrice = word.substr(1); // Strip the $
                    break;
                }
                if (!itemName.empty()) itemName += " ";
                itemName += word;
            }
        
            if (startingPrice.empty()) {
                return "Error: Missing price.";
            }
        
            // Step 3: Extract full quoted end time
            std::getline(iss, word, '"'); // discard whitespace before quote
            std::getline(iss, endTime, '"');
        
            // Step 4: Extract category ID
            iss >> categoryIdInt;
        
            // Debug
            std::cout << "Parsed Listing -> userId: " << userId
              << ", item: " << itemName
              << ", price: " << startingPrice
              << ", endTime: " << endTime
              << ", category: " << categoryIdInt << std::endl;
        
            double startingPriceDouble = std::stod(startingPrice);
        
            static Auction auctionManager(database);
            static Sell sellManager(database, auctionManager);
        
            bool success = sellManager.createListing(userId, itemName, startingPriceDouble, endTime, categoryIdInt);
            return success ? "Listing created successfully!" : "Failed to create listing.";
        }

        if (cmd == "CREATE_LISTING_TOKEN") {
            std::string token, itemName, startingPrice, endTime;
            int categoryIdInt = 1;
        
            // Step 1: Extract token
            if (!(iss >> token)) {
                return "Error: Missing token.";
            }
        
            // Step 2: Validate token and extract user ID
            int extractedUserId = -1;
            User user(database);
            if (!user.validateJWT(token, extractedUserId)) {
                return "Error: Invalid or expired token.";
            }
        
            // Step 3: Parse item name until $price
            std::string word;
            while (iss >> word) {
                if (!word.empty() && word[0] == '$') {
                    startingPrice = word.substr(1); // remove $
                    break;
                }
                if (!itemName.empty()) itemName += " ";
                itemName += word;
            }
        
            if (startingPrice.empty()) {
                return "Error: Missing price.";
            }
        
            // Step 4: Read quoted time and category ID
            std::getline(iss, word, '"'); // discard leading space
            std::getline(iss, endTime, '"');
            iss >> categoryIdInt;

            std::string imageUrl;
            iss >> std::ws;
            if (iss.peek() == '"') {
                iss.get(); // skip opening quote
                std::getline(iss, imageUrl, '"');
            }
        
            std::cout << "Parsed Listing -> userId: " << extractedUserId
                << ", item: " << itemName
                << ", price: " << startingPrice
                << ", endTime: " << endTime
                << ", category: " << categoryIdInt
                << ", image=" << imageUrl << std::endl;
  
            double startingPriceDouble = std::stod(startingPrice);
        
            static Auction auctionManager(database);
            static Sell sellManager(database, auctionManager);
        
            bool success = sellManager.createListing(extractedUserId, itemName, startingPriceDouble, endTime, categoryIdInt, imageUrl);
        
            return success ? "Listing created successfully!\n" : "Failed to create listing.\n";
        }

        // GET_ALL_AUCTIONS: Build JSON response with escaped strings.
        if (cmd == "GET_ALL_AUCTIONS") {
            Auction auction(database);
            std::vector<std::tuple<int, std::string, double, std::string>> auctions;
            if (!auction.getAllAuctions(auctions)) {
                return "Error retrieving auctions.\n";
            }
            std::stringstream ss;
            ss << "[";
            for (size_t i = 0; i < auctions.size(); i++) {
                auto [aid, name, price, endT] = auctions[i];
                ss << "{\"id\":" << aid
                   << ",\"title\":\"" << escapeJsonString(name)
                   << "\",\"currentPrice\":" << price
                   << ",\"endTime\":\"" << endT << "\"}";
                if (i + 1 < auctions.size()) {
                    ss << ",";
                }
            }
            ss << "]";
            return "ALL_AUCTIONS " + ss.str() + "\n";
        }

        // GET_AUCTION: Build JSON with escaped strings.
        if (cmd == "GET_AUCTION") {
            int aId;
            if (!(iss >> aId)) {
                return "Error: GET_AUCTION <auctionId>\n";
            }
            Auction auction(database);
            AuctionDetails details;
            if (!auction.getAuctionDetailsWithBids(aId, details)) {
                return "Auction not found.\n";
            }
            std::stringstream ss;
            ss << "{\"id\":" << details.auctionId
               << ",\"title\":\"" << escapeJsonString(details.itemName)
               << "\",\"currentBid\":" << details.currentPrice
               << ",\"endTime\":\"" << details.endTime
               << "\",\"bids\":[";
            for (size_t i = 0; i < details.bids.size(); i++) {
                const auto& b = details.bids[i];
                ss << "{\"username\":\"" << escapeJsonString(b.username)
                   << "\",\"amount\":" << b.amount
                   << ",\"time\":\"" << b.bidTime << "\"}";
                if (i + 1 < details.bids.size()) {
                    ss << ",";
                }
            }
            ss << "]}";
            return "AUCTION_DETAILS " + ss.str() + "\n";
        }

        if (cmd == "GET_AUCTIONS") {
            Auction auction(database);
            std::vector<std::tuple<int, std::string, double, std::string>> auctions;
            
            // Using getThenCheck pattern for debugging
            bool gotAuctions = auction.getAllAuctions(auctions);
            std::cout << "getAllAuctions returned: " << (gotAuctions ? "true" : "false") 
                      << " with " << auctions.size() << " auctions" << std::endl;
            
            if (gotAuctions) {
                std::stringstream jsonResponse;
                jsonResponse << "{\"action\":\"AUCTIONS_LIST\",\"auctions\":[";
                
                bool first = true;
                for (const auto& item : auctions) {
                    if (!first) jsonResponse << ",";
                    
                    int auctionId = std::get<0>(item);
                    std::string title = std::get<1>(item);
                    double currentBid = std::get<2>(item);
                    std::string endTime = std::get<3>(item);
                    
                    // Get image URL and category_id in one query to reduce database calls
                    std::string query = "SELECT category_id, image_url, starting_price, current_price FROM auction WHERE auction_id = " + std::to_string(auctionId);
                    try {
                        pqxx::work txn(*database.getConnection());
                        pqxx::result result = txn.exec(query);
                        txn.commit();
                        
                        // Set defaults
                        std::string categoryName = "other";
                        std::string imageUrl = "";
                        std::string condition = "new";
                        int bidCount = 0;
                        
                        if (!result.empty()) {
                            int categoryId = result[0]["category_id"].as<int>();
                            
                            // Only try to get category name if we have a valid category_id
                            // and we know the category table exists
                            try {
                                pqxx::work categoryTxn(*database.getConnection());
                                pqxx::result categoryResult = categoryTxn.exec(
                                    "SELECT category_name AS category_name FROM category WHERE category_id = " + std::to_string(categoryId)
                                );
                                categoryTxn.commit();
                                
                                if (!categoryResult.empty()) {
                                    categoryName = categoryResult[0]["category_name"].as<std::string>();
                                }
                            } catch (const std::exception& e) {
                                // If this fails, we'll still use the default category name
                                std::cerr << "Error getting category name: " << e.what() << std::endl;
                            }
                            
                            // Try to get bid count
                            try {
                                pqxx::work txn2(*database.getConnection());
                                pqxx::result bidResult = txn2.exec(
                                    "SELECT COUNT(*) as bid_count FROM bids WHERE auction_id = " + std::to_string(auctionId)
                                );
                                txn2.commit();
                                
                                if (!bidResult.empty()) {
                                    bidCount = bidResult[0]["bid_count"].as<int>();
                                }
                            } catch (const std::exception& e) {
                                std::cerr << "Error getting bid count: " << e.what() << std::endl;
                            }
                            
                            // Process image URL if present
                            if (!result[0]["image_url"].is_null()) {
                                imageUrl = result[0]["image_url"].as<std::string>();
                            }
                            
                            // Calculate condition
                            double startingPrice = result[0]["starting_price"].as<double>();
                            double currentPrice = result[0]["current_price"].as<double>();
                            double ratio = startingPrice > 0 ? currentPrice / startingPrice : 1.0;
                            
                            if (ratio > 1.5) condition = "excellent";
                            else if (ratio > 1.25) condition = "good";
                            else if (ratio > 1.1) condition = "fair";
                            else condition = "new";
                        }
                        
                        // Build the JSON object
                        jsonResponse << "{";
                        jsonResponse << "\"id\":" << auctionId << ",";
                        jsonResponse << "\"title\":\"" << escapeJsonString(title) << "\",";
                        jsonResponse << "\"current_bid\":" << currentBid << ",";
                        jsonResponse << "\"end_time\":\"" << escapeJsonString(endTime) << "\",";
                        jsonResponse << "\"bid_count\":" << bidCount << ",";
                        jsonResponse << "\"category\":\"" << escapeJsonString(categoryName) << "\",";
                        jsonResponse << "\"condition\":\"" << condition << "\"";
                        
                        // Only add image_url if it's not empty
                        if (!imageUrl.empty()) {
                            jsonResponse << ",\"image_url\":\"" << escapeJsonString(imageUrl) << "\"";
                        }
                        
                        jsonResponse << "}";
                        
                        first = false;
                    } catch (const std::exception& e) {
                        std::cerr << "Error processing auction " << auctionId << ": " << e.what() << std::endl;
                        // Continue to the next auction
                    }
                }
                
                jsonResponse << "]}";
                return jsonResponse.str() + "\n";
            } else {
                return "{\"status\":\"error\",\"message\":\"Failed to retrieve auctions\"}\n";
            }
        }

        // BID command: use bidder_id since that's the column in the database.
        if (cmd == "BID") {
            int auctionId;
            double bidAmount;
            if (!(iss >> auctionId >> bidAmount)) {
                return "Error: Invalid BID command. Usage: BID <auctionId> <bidAmount>\n";
            }
            if (!authenticated) {
                return "Please login first.\n";
            }
            Auction auction(database);
            std::string err;
            bool success = auction.placeBid(auctionId, userId, bidAmount, err);
            return success ? "Bid placed successfully.\n" : ("Bid failed: " + err + "\n");
        }

        if (cmd == "PLACE_BID") {
            // This command requires authentication
            if (!authenticated) {
                return "{\"status\":\"error\",\"message\":\"Please login to place a bid\"}\n";
            }
            
            int auctionId;
            double bidAmount;
            
            iss >> auctionId >> bidAmount;
            
            if (auctionId <= 0 || bidAmount <= 0) {
                return "{\"status\":\"error\",\"message\":\"Invalid auction ID or bid amount\"}\n";
            }
            
            Auction auction(database);
            std::string errorMessage;
            bool success = auction.placeBid(auctionId, userId, bidAmount, errorMessage);
            
            std::stringstream jsonResponse;
            if (success) {
                jsonResponse << "{\"action\":\"BID_UPDATE\",";
                jsonResponse << "\"auction_id\":" << auctionId << ",";
                jsonResponse << "\"new_bid\":" << bidAmount << ",";
                jsonResponse << "\"user_id\":" << userId << ",";
                jsonResponse << "\"status\":\"success\"}";
            } else {
                jsonResponse << "{\"status\":\"error\",\"message\":\"" << escapeJsonString(errorMessage) << "\"}";
            }
            
            return jsonResponse.str() + "\n";
        }

        if (cmd == "EXIT" || cmd == "QUIT") {
            running = false;
            return "Goodbye!\n";
        }

        return "Unknown command. Available commands: LOGIN, REGISTER, GET_AUCTIONS, GET_ALL_AUCTIONS, GET_AUCTION, BID, PLACE_BID, CREATE_AUCTION, CREATE_LISTING, CREATE_LISTING_TOKEN, EXIT\n";
    }
};

class TransactionServer {
public:
    TransactionServer(int port, Database& db)
        : port(port), running(false), database(db) {}

    bool start() {
        #ifdef _WIN32
        WSADATA wsaData;
        if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
            std::cerr << "WSAStartup failed\n";
            return false;
        }
        #endif

        serverSocket = socket(AF_INET, SOCK_STREAM, 0);
        if (serverSocket == INVALID_SOCKET) {
            std::cerr << "Error creating socket: " << SOCKET_ERROR_CODE << std::endl;
            return false;
        }

        // Set socket options to reuse address
        #ifdef _WIN32
            // Windows settings
            char opt = 1;
            if (setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt)) < 0) {
                std::cerr << "setsockopt(SO_REUSEADDR) failed: " << SOCKET_ERROR_CODE << std::endl;
                return false;
            }
        #else
            // Unix settings (Linux/macOS)
            int opt = 1;
            if (setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
                std::cerr << "setsockopt(SO_REUSEADDR) failed: " << SOCKET_ERROR_CODE << std::endl;
                return false;
            }
        #endif

        sockaddr_in serverAddr;
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;
        serverAddr.sin_port = htons(port);

        if (bind(serverSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
            std::cerr << "Bind failed: " << SOCKET_ERROR_CODE << std::endl;
            CLOSE_SOCKET(serverSocket);
            return false;
        }

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

        std::string command;
        while (running) {
            std::cin >> command;
            if (command == "quit" || command == "exit") {
                running = false;
            }
        }

        CLOSE_SOCKET(serverSocket);

        #ifdef _WIN32
        WSACleanup();
        #endif

        if (acceptThread.joinable()) {
            acceptThread.join();
        }

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
            sockaddr_in clientAddr;
            socklen_t clientAddrSize = sizeof(clientAddr);
            socket_t clientSocket = accept(serverSocket, (struct sockaddr*)&clientAddr, &clientAddrSize);
            if (clientSocket == INVALID_SOCKET) {
                if (!running) break;
                std::cerr << "Accept failed: " << SOCKET_ERROR_CODE << std::endl;
                continue;
            }

            char clientIP[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, &(clientAddr.sin_addr), clientIP, INET_ADDRSTRLEN);
            std::cout << "New connection from " << clientIP << ":" << ntohs(clientAddr.sin_port) << std::endl;

            ClientSession* session = new ClientSession(clientSocket, database);
            clientThreads.push_back(std::thread([session]() {
                session->handleClient();
                delete session;
            }));
            clientThreads.back().detach();
        }
    }
};

int main(int argc, char* argv[]) {
    int port = 8080;
    std::string connection_string =
        "postgresql://neondb_owner:npg_myZ1LbsMtSN2@ep-quiet-waterfall-a5ug6jn4-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "--port" && i + 1 < argc) {
            port = std::stoi(argv[++i]);
        } else if (arg == "--db" && i + 1 < argc) {
            connection_string = argv[++i];
        }
    }

    g_db = std::make_unique<Database>(connection_string);
    if (!g_db->initialize()) {
        std::cerr << "Failed to initialize database" << std::endl;
        return 1;
    }

    TransactionServer server(port, *g_db);
    if (server.start()) {
        std::cout << "Server is running. Press 'quit' or 'exit' to stop the server.\n";
        server.run();
    } else {
        std::cerr << "Failed to start server\n";
        return 1;
    }
    return 0;
}