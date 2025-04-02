#include "auction.h"
#include <iostream>

Auction::Auction(Database& db) : database(db) {}

bool Auction::createAuction(int userId, const std::string& itemName, double startingPrice, const std::string& endTime, int categoryId) {
    try {
        // Use default user ID if passed userId is invalid
        int validUserId = (userId <= 0) ? 1 : userId;
        
        // Set default timestamp if endTime is empty
        std::string validEndTime = endTime.empty() ? 
            "CURRENT_TIMESTAMP + INTERVAL '7 days'" : 
            "'" + endTime + "'";
        
        std::string query = "INSERT INTO auction (user_id, item_name, starting_price, current_price, end_time, status, category_id) "
                          "VALUES (" + std::to_string(validUserId) + ", '" + 
                          itemName + "', " + 
                          std::to_string(startingPrice) + ", " + 
                          std::to_string(startingPrice) + ", " +  
                          validEndTime + ", 'active', " +
                          std::to_string(categoryId) + ");";  // Added category_id
        
        std::cout << "Executing query: " << query << std::endl;
        
        pqxx::work txn(*database.getConnection());
        txn.exec(query);
        txn.commit();
        
        std::cout << "Auction created for item: " << itemName << " with starting price: " << startingPrice << std::endl;
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error creating auction: " << e.what() << std::endl;
        return false;
    }
}

bool Auction::getAllAuctions(std::vector<std::tuple<int, std::string, double, std::string>>& auctions) {
    try {
        std::string query = "SELECT auction_id, item_name, current_price, end_time FROM auction WHERE status = 'active';";
        
        pqxx::work txn(*database.getConnection());
        pqxx::result result = txn.exec(query);
        txn.commit();
        
        for (const auto& row : result) {
            int auctionId = row[0].as<int>();
            std::string itemName = row[1].as<std::string>();
            double currentPrice = row[2].as<double>();
            std::string endTime = row[3].as<std::string>();
            
            auctions.emplace_back(auctionId, itemName, currentPrice, endTime);
        }
        
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error fetching all auctions: " << e.what() << std::endl;
        return false;
    }
}

bool Auction::getAuctionDetails(int auctionId, std::string& itemName, double& highestBid, std::string& endTime) {
    try {
        std::string query = "SELECT item_name, current_price, end_time FROM auction WHERE auction_id = " + 
                           std::to_string(auctionId);
        
        pqxx::work txn(*database.getConnection());
        pqxx::result result = txn.exec(query);
        txn.commit();
        
        if (!result.empty()) {
            itemName = result[0]["item_name"].as<std::string>();
            highestBid = result[0]["current_price"].as<double>();
            endTime = result[0]["end_time"].as<std::string>();
            return true;
        }
        
        return false;
    } catch (const std::exception& e) {
        std::cerr << "Error fetching auction details: " << e.what() << std::endl;
        return false;
    }
}