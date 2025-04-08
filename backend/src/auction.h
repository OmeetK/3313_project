#ifndef AUCTION_H
#define AUCTION_H

#include "database.h"
#include <string>
#include <vector>
#include <tuple>

// Struct to hold detailed auction information
struct AuctionDetails {
    int auction_id;
    std::string item_name;
    double current_price;
    std::string end_time;
    int category_id;
    std::string category_name;
    int bid_count;
    std::string condition;
};

class Auction {
private:
    Database& database;

public:
    Auction(Database& db);
    
    // Create a new auction
    bool createAuction(int userId, const std::string& itemName, double startingPrice, 
                      const std::string& endTime, int categoryId = 1);
    
    // Get all auctions (simpler version to match server.cpp expectation)
    bool getAllAuctions(std::vector<std::tuple<int, std::string, double, std::string>>& auctions);
    
    // Get detailed auction information
    bool getAllAuctionDetails(std::vector<AuctionDetails>& auctions);
    
    // Get details for a specific auction
    bool getAuctionDetails(int auctionId, std::string& itemName, double& highestBid, std::string& endTime);
};

#endif // AUCTION_H