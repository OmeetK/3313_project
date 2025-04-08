#include "auction.h"
#include <iostream>
#include <pqxx/pqxx>
#include <sstream>
#include <mutex>
#include <unordered_map>

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
    // Change mutex types to timed_mutex to support timeout operations
    static std::mutex bidMutex;  // Global mutex for bidding operations
    static std::unordered_map<int, std::timed_mutex> auctionMutexes; // Changed to timed_mutex
    static std::mutex mapMutex;  // To protect access to the mutex map itself
    
    try {
        // Use scoped_lock to atomically acquire multiple locks without deadlock
        {
            // First acquire the global bidding mutex (short-term)
            std::lock_guard<std::mutex> globalLock(bidMutex);
            
            // Get or create auction-specific mutex
            std::timed_mutex* auctionMutexPtr;
            {
                std::lock_guard<std::mutex> mapLock(mapMutex);
                auctionMutexPtr = &auctionMutexes[auctionId];
            }
            
            // Now try_lock_for will work with timed_mutex
            if (!auctionMutexPtr->try_lock_for(std::chrono::seconds(3))) {
                errorMessage = "System is busy processing another bid on this auction. Please try again.";
                return false;
            }
            
            // Use RAII to automatically release the lock
            std::lock_guard<std::timed_mutex> auctionLock(*auctionMutexPtr, std::adopt_lock);
            
            // STEP 2: Begin database transaction with timeout
            pqxx::work txn(*database.getConnection());
            
            try {
                // Set statement timeout to prevent database-level deadlock
                txn.exec("SET LOCAL statement_timeout = '5000';"); // 5 second timeout
                
                // Lock the auction row for update
                std::string selectQuery = 
                    "SELECT current_price FROM auction "
                    "WHERE auction_id = " + std::to_string(auctionId) + " FOR UPDATE NOWAIT;"; // NOWAIT fails immediately if locked
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
                
                // Insert the new bid
                std::string insertBidQuery = 
                    "INSERT INTO bids (auction_id, bidder_id, bid_amount) VALUES (" +
                    std::to_string(auctionId) + ", " + std::to_string(userId) + ", " + 
                    std::to_string(bidAmount) + ");";
                txn.exec(insertBidQuery);
                
                // Commit the transaction
                txn.commit();
                return true;
                
            } catch (const pqxx::sql_error& e) {
                if (std::string(e.what()).find("could not obtain lock") != std::string::npos ||
                    std::string(e.what()).find("statement timeout") != std::string::npos) {
                    errorMessage = "Another bid is being processed. Please try again.";
                } else {
                    errorMessage = e.what();
                }
                return false;
            }
        }
    } catch (const std::exception& e) {
        errorMessage = e.what();
        return false;
    }
}
