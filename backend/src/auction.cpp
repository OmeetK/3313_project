#include "auction.h"
#include <iostream>
#include <pqxx/pqxx>
#include <sstream>

Auction::Auction(Database& db) : database(db) {}

int Auction::createAuction(int userId, const std::string& itemName, double startingPrice,
                           const std::string& endTime, int categoryId) {
    try {
        // Use default user ID if passed userId is invalid.
        int validUserId = (userId <= 0) ? 1 : userId;

        // Set default timestamp if endTime is empty.
        std::string validEndTime = endTime.empty()
            ? "CURRENT_TIMESTAMP + INTERVAL '7 days'"
            : "'" + endTime + "'";

        std::string query =
            "INSERT INTO auction (user_id, item_name, starting_price, current_price, end_time, status, category_id) "
            "VALUES (" + std::to_string(validUserId) + ", '" + itemName + "', " +
            std::to_string(startingPrice) + ", " + std::to_string(startingPrice) + ", " +
            validEndTime + ", 'active', " + std::to_string(categoryId) +
            ") RETURNING auction_id;";

        std::cout << "[Auction::createAuction] Executing query: " << query << std::endl;
        
        pqxx::work txn(*database.getConnection());
        pqxx::result r = txn.exec(query);
        txn.commit();

        if (!r.empty()) {
            int auctionId = r[0][0].as<int>();
            std::cout << "[Auction::createAuction] Auction created for item: " << itemName
                      << " with starting price: " << startingPrice
                      << " and auction_id: " << auctionId << std::endl;
            return auctionId;
        } else {
            std::cerr << "[Auction::createAuction] Auction created, but no auction_id returned." << std::endl;
            return -1;
        }
    } catch (const std::exception& e) {
        std::cerr << "[Auction::createAuction] Error: " << e.what() << std::endl;
        return -1;
    }
}

bool Auction::getAllAuctions(std::vector<std::tuple<int, std::string, double, std::string>>& auctions) {
    try {
        std::string query = "SELECT auction_id, item_name, current_price, end_time "
                            "FROM auction WHERE status = 'active';";

        pqxx::work txn(*database.getConnection());
        pqxx::result result = txn.exec(query);
        txn.commit();

        for (const auto& row : result) {
            int auctionId = row["auction_id"].as<int>();
            std::string itemName = row["item_name"].as<std::string>();
            double price = row["current_price"].as<double>();
            std::string endTime = row["end_time"].as<std::string>();
            auctions.emplace_back(auctionId, itemName, price, endTime);
        }
        return true;
    } catch (const std::exception& e) {
        std::cerr << "[Auction::getAllAuctions] Error: " << e.what() << std::endl;
        return false;
    }
}

bool Auction::getAuctionDetails(int auctionId, std::string& itemName, double& highestBid, std::string& endTime) {
    try {
        std::string query = 
            "SELECT item_name, current_price, end_time FROM auction "
            "WHERE auction_id = " + std::to_string(auctionId) + ";";

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
        std::cerr << "[Auction::getAuctionDetails] Error: " << e.what() << std::endl;
        return false;
    }
}

bool Auction::getAuctionDetailsWithBids(int auctionId, AuctionDetails& details) {
    // First get basic auction info
    details.auctionId = auctionId;
    if (!getAuctionDetails(auctionId, details.itemName, details.currentPrice, details.endTime)) {
        return false;
    }

    // Then fetch the bids
    try {
        pqxx::work txn(*database.getConnection());
        // Join the user table to get the username
        std::string query =
            "SELECT b.bid_amount, b.bid_time, u.username "
            "FROM bids b "
            "LEFT JOIN users u ON b.bidder_id = u.user_id "
            "WHERE b.auction_id = " + std::to_string(auctionId) +
            " ORDER BY b.bid_time DESC;";

        pqxx::result r = txn.exec(query);
        txn.commit();

        for (auto row : r) {
            BidRecord br;
            br.amount = row["bid_amount"].as<double>();
            br.bidTime = row["bid_time"].c_str();    // to string
            br.username = row["username"].c_str();   // could be null if no user row found
            details.bids.push_back(br);
        }
        return true;
    } catch (const std::exception& e) {
        std::cerr << "[Auction::getAuctionDetailsWithBids] Error retrieving bids: " << e.what() << std::endl;
        return false;
    }
}

bool Auction::placeBid(int auctionId, int userId, double bidAmount, std::string& errorMessage) {
    try {
        pqxx::work txn(*database.getConnection());

        // Ensure the bids table exists (noninvasive)
        std::string createBidsTableQuery =
            "CREATE TABLE IF NOT EXISTS bids ("
            "bid_id SERIAL PRIMARY KEY, "
            "auction_id INTEGER REFERENCES auction(auction_id), "
            "bidder_id INTEGER REFERENCES users(user_id), "
            "bid_amount NUMERIC(10,2) NOT NULL, "
            "bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
            ");";
        txn.exec(createBidsTableQuery);

        // Lock the auction row for update
        std::string selectQuery = 
            "SELECT current_price FROM auction "
            "WHERE auction_id = " + std::to_string(auctionId) + " FOR UPDATE;";
        pqxx::result result = txn.exec(selectQuery);

        if (result.empty()) {
            errorMessage = "Auction not found.";
            return false;
        }

        double currentPrice = result[0]["current_price"].as<double>();
        if (bidAmount < currentPrice + 10) {
            errorMessage = "Bid must be at least $10 higher than the current price.";
            return false;
        }

        // Update the current price on the auction
        std::string updateQuery = 
            "UPDATE auction SET current_price = " + std::to_string(bidAmount) +
            " WHERE auction_id = " + std::to_string(auctionId) + ";";
        txn.exec(updateQuery);

        // Insert the new bid, note we use bidder_id instead of user_id
        std::string insertBidQuery = 
            "INSERT INTO bids (auction_id, bidder_id, bid_amount) VALUES (" +
            std::to_string(auctionId) + ", " + std::to_string(userId) + ", " + 
            std::to_string(bidAmount) + ");";
        txn.exec(insertBidQuery);

        txn.commit();
        return true;
    } catch (const std::exception& e) {
        errorMessage = e.what();
        return false;
    }
}
