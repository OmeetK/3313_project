#ifndef DATABASE_H
#define DATABASE_H

#include <string>
#include <mutex>
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
    
    // Provide access to the connection
    pqxx::connection* getConnection();
    
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