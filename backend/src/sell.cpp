#include "sell.h"
#include <iostream>
#include <sstream>

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
        
        // Create the auction using the Auction class
        bool success = auctionManager.createAuction(userId, itemName, startingPrice, endTime, categoryId);
        
        if (success && !imageUrl.empty()) {
            // Update with image URL if provided
            std::string updateQuery = "UPDATE auction SET image_url = '" + imageUrl + "' "
                                    "WHERE user_id = " + std::to_string(userId) + 
                                    " AND item_name = '" + itemName + "' "
                                    "ORDER BY created_at DESC LIMIT 1;";
            
            success = database.runQuery(updateQuery);
        }
        
        return success;
    } catch (const std::exception& e) {
        std::cerr << "Error creating listing: " << e.what() << std::endl;
        return false;
    }
}
