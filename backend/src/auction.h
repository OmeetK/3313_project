#ifndef AUCTION_H
#define AUCTION_H

#include <string>
#include <vector>
#include <tuple>
#include "database.h"

// Simple struct to hold individual bid info for JSON serialization
struct BidRecord {
    std::string username;  // from users.username
    double amount;
    std::string bidTime;   // timestamp
};

// Holds all details for a single auction, including its bids.
struct AuctionDetails {
    int auctionId;
    std::string itemName;
    double currentPrice;
    std::string endTime;
    std::vector<BidRecord> bids;
};

class Auction {
public:
    Auction(Database& db);
    
    // Creates a new auction and returns the new auction_id (or -1 on failure).
    int createAuction(int userId, const std::string& itemName, double startingPrice, 
                      const std::string& endTime, int categoryId);

    // Returns summary info (auction_id, item_name, current_price, end_time) for all active auctions
    bool getAllAuctions(std::vector<std::tuple<int, std::string, double, std::string>>& auctions);

    // Returns minimal details for a single auction (title, current_price, end_time)
    bool getAuctionDetails(int auctionId, std::string& itemName, double& highestBid, std::string& endTime);

    // Returns full details, including the bid history
    bool getAuctionDetailsWithBids(int auctionId, AuctionDetails& details);

    // Places a bid; on success, returns true. On failure, returns false + errorMessage.
    bool placeBid(int auctionId, int userId, double bidAmount, std::string& errorMessage);

private:
    Database& database;
};

#endif // AUCTION_H
