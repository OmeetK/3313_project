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

// Modified to match the signature expected in server.cpp
bool Auction::getAllAuctions(std::vector<std::tuple<int, std::string, double, std::string>>& auctions) {
    try {
        std::string query = R"(
            SELECT 
                a.auction_id, 
                a.item_name, 
                a.current_price, 
                a.end_time
            FROM 
                auction a
            WHERE 
                a.status = 'active'
        )";
        
        pqxx::work txn(*database.getConnection());
        pqxx::result result = txn.exec(query);
        txn.commit();
        
        for (const auto& row : result) {
            int auctionId = row["auction_id"].as<int>();
            std::string itemName = row["item_name"].as<std::string>();
            double currentPrice = row["current_price"].as<double>();
            std::string endTime = row["end_time"].as<std::string>();
            
            auctions.emplace_back(auctionId, itemName, currentPrice, endTime);
        }
        
        return !auctions.empty();
    } catch (const std::exception& e) {
        std::cerr << "Error fetching auctions: " << e.what() << std::endl;
        return false;
    }
}

// Additional method that returns more detailed auction information
// This can be used alongside the simpler method for backward compatibility
bool Auction::getAllAuctionDetails(std::vector<AuctionDetails>& auctions) {
    try {
        std::string query = R"(
            SELECT 
                a.auction_id, 
                a.item_name, 
                a.current_price, 
                a.end_time, 
                a.category_id, 
                COALESCE(c.name, 'Uncategorized') AS category_name,
                COALESCE((SELECT COUNT(*) FROM bids WHERE auction_id = a.auction_id), 0) AS bid_count,
                CASE 
                    WHEN a.current_price > a.starting_price * 1.5 THEN 'excellent'
                    WHEN a.current_price > a.starting_price * 1.25 THEN 'good'
                    WHEN a.current_price > a.starting_price * 1.1 THEN 'fair'
                    ELSE 'new'
                END AS condition
            FROM 
                auction a
            LEFT JOIN 
                category c ON a.category_id = c.id
            WHERE 
                a.status = 'active'
        )";
        
        pqxx::work txn(*database.getConnection());
        pqxx::result result = txn.exec(query);
        txn.commit();
        
        for (const auto& row : result) {
            AuctionDetails auction;
            auction.auction_id = row["auction_id"].as<int>();
            auction.item_name = row["item_name"].as<std::string>();
            auction.current_price = row["current_price"].as<double>();
            auction.end_time = row["end_time"].as<std::string>();
            auction.category_id = row["category_id"].as<int>();
            auction.category_name = row["category_name"].as<std::string>();
            auction.bid_count = row["bid_count"].as<int>();
            auction.condition = row["condition"].as<std::string>();
            
            auctions.push_back(auction);
        }
        
        return !auctions.empty();
    } catch (const std::exception& e) {
        std::cerr << "Error fetching auctions: " << e.what() << std::endl;
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