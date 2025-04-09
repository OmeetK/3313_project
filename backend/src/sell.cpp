#include "sell.h"
#include <iostream>
#include <sstream>
#include <pqxx/pqxx>

Sell::Sell(Database& db, Auction& auction) : database(db), auctionManager(auction) {}

bool Sell::createListing(int userId, const std::string& itemName, double startingPrice, 
                        const std::string& endTime, int categoryId, const std::string& imageUrl) {
    try {
        // Validate inputs
        if (itemName.empty()) {
            std::cerr << "Item name cannot be empty" << std::endl;
            return false;
        }
        
        if (startingPrice < 0) {
            std::cerr << "Starting price cannot be negative" << std::endl;
            return false;
        }
        
        // Remove the marker if present (functionality from first file)
        std::string actualItemName = itemName;
        std::string marker = " __SINGLE_WORD_MARKER__";
        size_t markerPos = actualItemName.find(marker);
        if (markerPos != std::string::npos) {
            actualItemName = actualItemName.substr(0, markerPos);
        }
        
        // Create the auction using the Auction class with the cleaned item name
        bool success = auctionManager.createAuction(userId, actualItemName, startingPrice, endTime, categoryId);
        
        if (success && !imageUrl.empty()) {
            // Combine both update query approaches for maximum flexibility
            // First file uses auction_id subquery, second file uses direct user_id + item_name lookup
            std::string updateQuery = "UPDATE auction SET image_url = '" + imageUrl + "' "
                                    "WHERE auction_id = (SELECT auction_id FROM auction "
                                    "WHERE user_id = " + std::to_string(userId) + 
                                    " AND item_name = '" + actualItemName + "' "
                                    "ORDER BY created_at DESC LIMIT 1);";
            
            success = database.executeQuery(updateQuery);
        }
        
        return success;
    } catch (const std::exception& e) {
        std::cerr << "Error creating listing: " << e.what() << std::endl;
        return false;
    }
}