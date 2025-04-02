#ifndef AUCTION_H
#define AUCTION_H

#include <string>
#include "database.h"

class Auction {
public:
    Auction(Database& db);
    bool createAuction(int userId, const std::string& itemName, double startingPrice, const std::string& endTime, int categoryId = 1);
    //bool placeBid(int auctionId, int userId, double bidAmount);
    //bool closeAuction(int auctionId);
    bool getAuctionDetails(int auctionId, std::string& itemName, double& highestBid, std::string& endTime);
    bool getAllAuctions(std::vector<std::tuple<int, std::string, double, std::string>>& auctions);
private:
    Database& database;
};  
#endif // AUCTION_H  