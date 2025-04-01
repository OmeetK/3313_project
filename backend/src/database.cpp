#include "database.h"
#include <pqxx/pqxx>
#include <iostream>
#include <sstream>

Database::Database(const std::string& connection_string) 
    : connection_string(connection_string) {
    try {
        // Create connection
        conn = std::make_unique<pqxx::connection>(connection_string);
        std::cout << "Connected to database: " << conn->dbname() << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Database connection error: " << e.what() << std::endl;
        conn = nullptr;
    }
}

Database::~Database() {
    // Connection will be automatically closed by unique_ptr
}

bool Database::initialize() {
    if (!conn || !conn->is_open()) {
        std::cerr << "Cannot initialize database: No connection" << std::endl;
        return false;
    }
    
    return createTablesIfNotExist();
}

bool Database::createTablesIfNotExist() {
    try {
        // Create Users table
        executeQuery(
            "CREATE TABLE IF NOT EXISTS users ("
            "user_id SERIAL PRIMARY KEY,"
            "username VARCHAR(100) UNIQUE NOT NULL,"
            "email VARCHAR(100) NOT NULL,"
            "password VARCHAR(255) NOT NULL,"
            "balance NUMERIC(10, 2) DEFAULT 0.00"
            ");"
        );
        executeQuery(
            "CREATE TABLE users2 ("
                "user_id SERIAL PRIMARY KEY,"
                "username VARCHAR(100) NOT NULL,"
                "email VARCHAR(100) NOT NULL UNIQUE,"
                "password VARCHAR(255) NOT NULL"
            ");"        
        );
        
        // Create Transactions table
        executeQuery(
            "CREATE TABLE IF NOT EXISTS transactions ("
            "id SERIAL PRIMARY KEY,"
            "user_id INTEGER REFERENCES users(id),"
            "status VARCHAR(20) DEFAULT 'pending',"
            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
            "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
            ");"
        );
        
        // Create Operations table
        executeQuery(
            "CREATE TABLE IF NOT EXISTS operations ("
            "id SERIAL PRIMARY KEY,"
            "transaction_id INTEGER REFERENCES transactions(id),"
            "operation_data TEXT NOT NULL,"
            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
            ");"
        );
        
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error creating tables: " << e.what() << std::endl;
        return false;
    }
}

bool Database::executeQuery(const std::string& query) {
    try {
        if (!conn || !conn->is_open()) {
            std::cerr << "Database connection lost. Attempting to reconnect..." << std::endl;
            conn = std::make_unique<pqxx::connection>(connection_string);
            if (!conn->is_open()) {
                std::cerr << "Failed to reconnect to the database." << std::endl;
                return false;
            }
            std::cout << "Reconnected to the database." << std::endl;
        }

        pqxx::work txn(*conn);
        txn.exec(query);
        txn.commit();
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Query execution error: " << e.what() << std::endl;
        return false;
    }
}

bool Database::createUser(const std::string& username, const std::string& email, const std::string& password) {
    try {
        std::lock_guard<std::mutex> lock(db_mutex);
        
        // In a real application, you should hash the password
        std::string query = "INSERT INTO users (username, email, password, balance) "
                            "VALUES ('" + username + "', '" + email + "', '" + password + "', 0.00) "
                            "RETURNING user_id;";

        pqxx::work txn(*conn);
        pqxx::result result = txn.exec(query);
        txn.commit();
        
        // Check if user was created (affected rows > 0)
        return result.affected_rows() > 0;
    } catch (const std::exception& e) {
        std::cerr << "Error creating user: " << e.what() << std::endl;
        return false;
    }
}

int Database::authenticateUser(const std::string& username, const std::string& password) {
    try {
        std::lock_guard<std::mutex> lock(db_mutex);

        // Construct the query
        std::string query = "SELECT user_id FROM users WHERE username = '" +
                            username + "' AND password = '" + password + "';";

        // Print the query for debugging
        std::cout << "Executing query: " << query << std::endl;

        // Execute the query
        pqxx::work txn(*conn);
        pqxx::result result = txn.exec(query);
        txn.commit();

        
        if (!result.empty()) {
            int userId = result[0][0].as<int>();
            std::cout << "Authentication successful for user: " << username 
                      << ". User ID: " << userId << std::endl;
            return userId; // Return user_id
        }

        std::cout << "Authentication failed for user: " << username << std::endl;
        return -1; 
    } catch (const std::exception& e) {
        std::cerr << "Error authenticating user: " << e.what() << std::endl;
        return -1; 
    }
}
int Database::beginTransaction(const std::string& username) {
    try {
        std::lock_guard<std::mutex> lock(db_mutex);
        
        // Get user ID
        std::string userQuery = "SELECT user_id FROM users WHERE username = '" + username + "';";
        pqxx::work userTxn(*conn);
        pqxx::result userResult = userTxn.exec(userQuery);
        userTxn.commit();
        
        if (userResult.empty()) {
            return -1; // User not found
        }
        
        int userId = userResult[0][0].as<int>();
        
        // Create transaction
        std::string txnQuery = "INSERT INTO transactions (user_id, status) "
                              "VALUES (" + std::to_string(userId) + ", 'pending') "
                              "RETURNING id;";
        
        pqxx::work txn(*conn);
        pqxx::result result = txn.exec(txnQuery);
        txn.commit();
        
        if (result.empty()) {
            return -1;
        }
        
        return result[0][0].as<int>();
    } catch (const std::exception& e) {
        std::cerr << "Error beginning transaction: " << e.what() << std::endl;
        return -1;
    }
}

bool Database::executeOperation(int transId, const std::string& operation) {
    try {
        std::lock_guard<std::mutex> lock(db_mutex);
        
        // First, check if transaction exists and is still pending
        std::string checkQuery = "SELECT id FROM transactions WHERE id = " + 
                                std::to_string(transId) + " AND status = 'pending';";
        
        pqxx::work checkTxn(*conn);
        pqxx::result checkResult = checkTxn.exec(checkQuery);
        checkTxn.commit();
        
        if (checkResult.empty()) {
            return false; // Transaction not found or not pending
        }
        
        // Insert the operation
        std::string opQuery = "INSERT INTO operations (transaction_id, operation_data) "
                             "VALUES (" + std::to_string(transId) + ", " +
                             "'" + operation + "');";
        
        pqxx::work txn(*conn);
        txn.exec(opQuery);
        txn.commit();
        
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error executing operation: " << e.what() << std::endl;
        return false;
    }
}

bool Database::commitTransaction(int transId) {
    try {
        std::lock_guard<std::mutex> lock(db_mutex);
        
        // Update transaction status to 'committed'
        std::string query = "UPDATE transactions SET status = 'committed', "
                           "updated_at = CURRENT_TIMESTAMP "
                           "WHERE id = " + std::to_string(transId) + 
                           " AND status = 'pending';";
        
        pqxx::work txn(*conn);
        pqxx::result result = txn.exec(query);
        txn.commit();
        
        return result.affected_rows() > 0;
    } catch (const std::exception& e) {
        std::cerr << "Error committing transaction: " << e.what() << std::endl;
        return false;
    }
}

bool Database::rollbackTransaction(int transId) {
    try {
        std::lock_guard<std::mutex> lock(db_mutex);
        
        // Update transaction status to 'aborted'
        std::string query = "UPDATE transactions SET status = 'aborted', "
                           "updated_at = CURRENT_TIMESTAMP "
                           "WHERE id = " + std::to_string(transId) + 
                           " AND status = 'pending';";
        
        pqxx::work txn(*conn);
        pqxx::result result = txn.exec(query);
        txn.commit();
        
        return result.affected_rows() > 0;
    } catch (const std::exception& e) {
        std::cerr << "Error rolling back transaction: " << e.what() << std::endl;
        return false;
    }
}