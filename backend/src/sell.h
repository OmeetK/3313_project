#ifndef SELL_H
#define SELL_H

#include "database.h"
#include "auction.h"
#include <string>

class Sell {
public:
    Sell(Database& db, Auction& auction);
    
    // Create a new listing with optional image URL
    bool createListing(int userId, const std::string& itemName, double startingPrice, 
                      const std::string& endTime, int categoryId, 
                      const std::string& imageUrl = "");
    
private:
    Database& database;
    Auction& auctionManager;
};

#endif // SELL_H