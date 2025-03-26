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
            "id SERIAL PRIMARY KEY,"
            "username VARCHAR(50) UNIQUE NOT NULL,"
            "password VARCHAR(100) NOT NULL,"
            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
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
        pqxx::work txn(*conn);
        txn.exec(query);
        txn.commit();
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Query execution error: " << e.what() << std::endl;
        return false;
    }
}

bool Database::createUser(const std::string& username, const std::string& password) {
    try {
        std::lock_guard<std::mutex> lock(db_mutex);
        
        // In a real application, you should hash the password
        std::string query = "INSERT INTO users (username, password) "
                            "VALUES ('" + username + "', '" + password + "') "
                            "ON CONFLICT (username) DO NOTHING;";
        
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

bool Database::authenticateUser(const std::string& username, const std::string& password) {
    try {
        std::lock_guard<std::mutex> lock(db_mutex);
        
        std::string query = "SELECT id FROM users WHERE username = '" + 
                            username + "' AND password = '" + password + "';";
        
        pqxx::work txn(*conn);
        pqxx::result result = txn.exec(query);
        txn.commit();
        
        // User is authenticated if we found a matching record
        return !result.empty();
    } catch (const std::exception& e) {
        std::cerr << "Error authenticating user: " << e.what() << std::endl;
        return false;
    }
}

int Database::beginTransaction(const std::string& username) {
    try {
        std::lock_guard<std::mutex> lock(db_mutex);
        
        // Get user ID
        std::string userQuery = "SELECT id FROM users WHERE username = '" + username + "';";
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