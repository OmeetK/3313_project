#ifndef DATABASE_H
#define DATABASE_H

#include <string>
#include <memory>
#include <mutex>

namespace pqxx {
    class connection;
}

class Database {
public:
    Database(const std::string& connection_string);
    ~Database();
    
    bool initialize();
    pqxx::connection* getConnection();
    bool executeQuery(const std::string& query);
    
private:
    bool createTablesIfNotExist();
    
    std::string connection_string;
    std::unique_ptr<pqxx::connection> conn;
    std::mutex db_mutex; // Mutex for thread-safe database operations
};

#endif // DATABASE_H