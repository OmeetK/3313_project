#include "user.h"
#include <iostream>
#include <jwt/jwt.hpp>

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

std::string User::generateJWT(int userId, const std::string& username) {
    try {
        // Create JWT object
        jwt::jwt_object obj{
            jwt::params::algorithm("HS256"),
            jwt::params::secret(JWT_SECRET)
        };
        
        // Set payload
        obj.add_claim("userId", userId)
           .add_claim("username", username)
           .add_claim("exp", std::chrono::system_clock::now() + std::chrono::hours(24)); // 24-hour expiration
        
        // Return encoded token
        return obj.signature();
    } catch (const std::exception& e) {
        std::cerr << "JWT generation error: " << e.what() << std::endl;
        return "";
    }
}

bool User::validateJWT(const std::string& token, int& userId) {
    try {
        auto decoded = jwt::decode(token, jwt::params::algorithms({"HS256"}), jwt::params::secret(JWT_SECRET), jwt::params::verify(true));
        
        userId = decoded.payload().get_claim_value<int>("userId");
        return true;
    } catch (const std::exception& e) {
        std::cerr << "JWT validation error: " << e.what() << std::endl;
        return false;
    }
}