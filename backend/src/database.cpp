// database.cpp

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

pqxx::connection* Database::getConnection() {
    if (!conn || !conn->is_open()) {
        conn = std::make_unique<pqxx::connection>(connection_string);
    }
    return conn.get();
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
            "CREATE TABLE IF NOT EXISTS auction ("
            "auction_id SERIAL PRIMARY KEY,"
            "user_id INTEGER REFERENCES users(user_id),"
            "item_name VARCHAR(255) NOT NULL,"
            "starting_price NUMERIC(10, 2) NOT NULL,"
            "current_price NUMERIC(10, 2),"
            "end_time TIMESTAMP NOT NULL,"
            "status VARCHAR(20) DEFAULT 'active',"
            "winner_id INTEGER REFERENCES users(user_id),"
            "category_id INTEGER NOT NULL DEFAULT 1," // Add this line
            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
            "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
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