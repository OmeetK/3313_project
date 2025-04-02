
#include "user.h"
#include <iostream>

User::User(Database& db) : database(db) {}

bool User::createUser(const std::string& username, const std::string& email, const std::string& password) {
    try {
        std::string query = "INSERT INTO users (username, email, password, balance) "
                            "VALUES ('" + username + "', '" + email + "', '" + password + "', 0.00);";
        
        pqxx::work txn(*database.getConnection());
        txn.exec(query);
        txn.commit();
        
        std::cout << "User created: " << username << std::endl;
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error creating user: " << e.what() << std::endl;
        return false;
    }
}

int User::authenticateUser(const std::string& username, const std::string& password) {
    try {
        std::string query = "SELECT user_id FROM users WHERE username = '" +
                            username + "' AND password = '" + password + "';";
        
        std::cout << "Executing query: " << query << std::endl;
        
        pqxx::work txn(*database.getConnection());
        pqxx::result result = txn.exec(query);
        txn.commit();
        
        if (!result.empty()) {
            int userId = result[0][0].as<int>();
            std::cout << "Authentication successful for user: " << username
                      << ". User ID: " << userId << std::endl;
            return userId;
        }
        
        std::cout << "Authentication failed for user: " << username << std::endl;
        return -1;
    } catch (const std::exception& e) {
        std::cerr << "Error authenticating user: " << e.what() << std::endl;
        return -1;
    }
}

int User::getUserId(const std::string& username) {
    try {
        std::string query = "SELECT user_id FROM users WHERE username = '" + username + "';";
        
        pqxx::work txn(*database.getConnection());
        pqxx::result result = txn.exec(query);
        txn.commit();
        
        if (!result.empty()) {
            int userId = result[0][0].as<int>();
            return userId;
        }
        
        std::cerr << "User not found: " << username << std::endl;
        return -1;
    } catch (const std::exception& e) {
        std::cerr << "Error getting user ID: " << e.what() << std::endl;
        return -1;
    }
}