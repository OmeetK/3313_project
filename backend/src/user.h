#ifndef USER_H
#define USER_H

#include <string>
#include "database.h"
#include <string>
#include <jwt/jwt.hpp>
#include <jwt/jwt.hpp>

class User {
public:
    User(Database& db);
    bool createUser(const std::string& username, const std::string& email, const std::string& password);
    int authenticateUser(const std::string& username, const std::string& password);
    int getUserId(const std::string& username);
    std::string generateJWT(int userId, const std::string& username);
    bool validateJWT(const std::string& token, int& userId);
private:
    Database& database;
    const std::string JWT_SECRET = "1c2ca0f01710174ed526b7ed3e026a75b66864acca486d99024602621f697ad41d7298d34d75245303da01adb56f3288722242d3a25124ad016bf2edc560c6c7759ece97598655d97d56e45712edf4e04a0d49deced910e06422c69e31d6f0e6c4a58938b0dbb4e97ccf2d1d9bad292964acfaada7e0bd30858e7bb109d6f2607d6f3a10a18c2041954154bd96c4bfe817678fc7422fa99f93e6cfd1292d0c734081a9e90d6e544c4ae8075b97fba2cf596493be2e9b826dfd6e2f2f99ff918d8780dc95a111830b9308c5ed1d956360de1af3c9293f1bc3e7259843e5989fa005e7b8d05c6e3d1b993ff31d6bfe6b56947515c52ac37197ec2a79de18614b12";

};

#endif // USER_H