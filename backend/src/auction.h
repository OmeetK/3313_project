#ifndef AUCTION_H
#define AUCTION_H

#include "database.h"
#include <string>
#include <vector>
#include <tuple>

// Structure to represent a bid record
struct BidRecord {
    double amount;
    std::string bidTime;
    std::string username;
};

// Structure to hold detailed auction information
struct AuctionDetails {
    int auctionId;
    std::string itemName;
    double currentPrice;
    std::string endTime;
    int categoryId = 0;
    std::string categoryName = "Uncategorized";
    int bidCount = 0;
    std::string condition = "new";
    std::vector<BidRecord> bids;
};

class Auction {
public:
    Auction(Database& db);
    
    // Create auction - returns auction ID or -1 on failure
    int createAuction(int userId, const std::string& itemName, double startingPrice, 
                      const std::string& endTime, int categoryId);
    
    // Boolean version for backward compatibility
    bool createAuctionBool(int userId, const std::string& itemName, double startingPrice, 
                         const std::string& endTime, int categoryId);
    
    // Get basic auction list
    bool getAllAuctions(std::vector<std::tuple<int, std::string, double, std::string>>& auctions);
    
    // Get detailed auction list with category information
    bool getAllAuctionDetails(std::vector<AuctionDetails>& auctions);
    
    // Get basic details for a single auction
    bool getAuctionDetails(int auctionId, std::string& itemName, double& highestBid, std::string& endTime);
    
    // Get detailed information for a single auction including bid history
    bool getAuctionDetailsWithBids(int auctionId, AuctionDetails& details);
    
    // Place a bid on an auction
    bool placeBid(int auctionId, int userId, double bidAmount, std::string& errorMessage);

private:
    Database& database;
};

#endif // AUCTION_H