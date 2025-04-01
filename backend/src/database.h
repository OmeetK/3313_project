#ifndef DATABASE_H
#define DATABASE_H

#include <string>
#include <mutex>
#include <vector>
#include <memory>
#include <pqxx/pqxx>  // Include the full header instead of forward declarations

class Database {
public:
    // Constructor with connection parameters
    Database(const std::string& connection_string);
    
    // Destructor
    ~Database();
    
    // Initialize the database (create tables if they don't exist)
    bool initialize();
    
    // User management
    bool createUser(const std::string& username, const std::string& email, const std::string& password);
    int authenticateUser(const std::string& username, const std::string& password);
    
    // Transaction management
    int beginTransaction(const std::string& username);
    bool executeOperation(int transId, const std::string& operation);
    bool commitTransaction(int transId);
    bool rollbackTransaction(int transId);
    
private:
    std::string connection_string;
    std::unique_ptr<pqxx::connection> conn;
    std::mutex db_mutex;
    
    // Helper methods
    bool executeQuery(const std::string& query);
    
    // Check if tables exist and create them if needed
    bool createTablesIfNotExist();
};

#endif // DATABASE_H