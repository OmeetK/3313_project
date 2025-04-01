#ifndef USER_H
#define USER_H

#include <string>
#include "database.h"

class User {
public:
    User(Database& db);
    bool createUser(const std::string& username, const std::string& email, const std::string& password);
    int authenticateUser(const std::string& username, const std::string& password);
    
private:
    Database& database;
};

#endif // USER_H