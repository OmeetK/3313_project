#ifndef SELL_H
#define SELL_H

#include <string>
#include <vector>
#include "database.h"
#include "auction.h"

class Sell {
public:
    Sell(Database& db, Auction& auction);

    // Create a new auction listing
    bool createListing(int userId, const std::string& itemName, double startingPrice, 
        const std::string& endTime, int categoryId = 1, 
        const std::string& imageUrl = "");

private:
    Database& database;
    Auction& auctionManager;
        
    // Helper method to check if user owns the auction
    bool userOwnsAuction(int userId, int auctionId);
        
    // Helper method to check if auction has bids
    bool auctionHasBids(int auctionId);
    
};

#endif // SELL_H