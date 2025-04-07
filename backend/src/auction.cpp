#include "auction.h"
#include <iostream>
#include <sstream>
#include <pqxx/pqxx> 

Auction::Auction(Database& db) : database(db) {}

bool Auction::placeBid(int auctionId, int bidderId, double bidAmount) {
    try {
        // Update the auction only if the new bid is higher and the auction is still active.
        std::stringstream update;
        update << "UPDATE auction SET current_price = " << bidAmount << ", winner_id = " << bidderId
               << ", updated_at = CURRENT_TIMESTAMP WHERE auction_id = " << auctionId
               << " AND current_price < " << bidAmount
               << " AND end_time > CURRENT_TIMESTAMP AND status = 'active';";
        
        pqxx::work txn(*database.getConnection());
        pqxx::result res = txn.exec(update.str());
        txn.commit();
        
        if (res.affected_rows() == 0) {
            return false; // Bid did not update any row (bid too low or auction inactive)
        }
        
        // Record the bid in the bids table for history
        std::stringstream insertBid;
        insertBid << "INSERT INTO bids (auction_id, bidder_id, bid_amount) VALUES ("
                  << auctionId << ", " << bidderId << ", " << bidAmount << ");";
        database.executeQuery(insertBid.str());
        
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error placing bid: " << e.what() << std::endl;
        return false;
    }
}

std::string Auction::getAuctionDetailsJson(int auctionId) {
    try {
        // Retrieve auction details
        std::stringstream query;
        query << "SELECT auction_id, item_name, current_price, end_time FROM auction WHERE auction_id = " 
              << auctionId << ";";
        pqxx::work txn(*database.getConnection());
        pqxx::result result = txn.exec(query.str());
        txn.commit();
        
        if (result.empty()) {
            return "{}";
        }
        
        int id = result[0]["auction_id"].as<int>();
        std::string itemName = result[0]["item_name"].as<std::string>();
        double currentPrice = result[0]["current_price"].as<double>();
        std::string endTime = result[0]["end_time"].as<std::string>();
        
        // Retrieve bid history for this auction
        std::stringstream bidQuery;
        bidQuery << "SELECT bid_id, bidder_id, bid_amount, bid_time FROM bids WHERE auction_id = " 
                 << auctionId << " ORDER BY bid_time ASC;";
        pqxx::work txn2(*database.getConnection());
        pqxx::result bidsResult = txn2.exec(bidQuery.str());
        txn2.commit();
        
        // Build a JSON string manually
        std::stringstream json;
        json << "{";
        json << "\"auction_id\": " << id << ",";
        json << "\"item_name\": \"" << itemName << "\",";
        json << "\"current_price\": " << currentPrice << ",";
        json << "\"end_time\": \"" << endTime << "\",";
        json << "\"bid_history\": [";
        
        bool first = true;
        for (const auto& row : bidsResult) {
            if (!first) {
                json << ",";
            }
            first = false;
            json << "{";
            json << "\"bid_id\": " << row["bid_id"].as<int>() << ",";
            json << "\"bidder_id\": " << row["bidder_id"].as<int>() << ",";
            json << "\"bid_amount\": " << row["bid_amount"].as<double>() << ",";
            json << "\"bid_time\": \"" << row["bid_time"].as<std::string>() << "\"";
            json << "}";
        }
        json << "]";
        json << "}";
        
        return json.str();
    } catch (const std::exception& e) {
        std::cerr << "Error fetching auction details with bid history: " << e.what() << std::endl;
        return "{}";
    }
}

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