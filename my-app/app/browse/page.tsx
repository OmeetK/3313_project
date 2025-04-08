"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import websocketService from "@/app/lib/websocket";

interface AuctionBrief {
  id: number;
  title: string;
  currentPrice: number;
  endTime: string;
}

export default function BrowsePage() {
  const [auctions, setAuctions] = useState<AuctionBrief[]>([]);

  useEffect(() => {
    // Connect once
    websocketService.connect().then(() => {
      console.log("Connected to WebSocket. Requesting all auctions...");
      // Send the command to the C++ server
      websocketService.sendCommand("GET_ALL_AUCTIONS");
    });

    // Handle the server's response
    const handleMessage = (data: any) => {
      if (data.type === "server" && data.response.startsWith("ALL_AUCTIONS")) {
        const jsonPart = data.response.replace("ALL_AUCTIONS", "").trim();
        try {
          const parsed = JSON.parse(jsonPart);
          setAuctions(parsed);
        } catch (err) {
          console.error("Failed to parse auctions JSON:", err);
        }
      }
    };

    websocketService.on("message", handleMessage);

    // Cleanup if needed:
    // return () => { ... remove listener if your websocketService supports it }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Browse Auctions</h1>
      <div className="grid grid-cols-3 gap-6">
        {auctions.map((auction) => (
          <div key={auction.id} className="border p-4 rounded shadow-sm">
            <h2 className="text-xl font-semibold">{auction.title}</h2>
            <p>Current: ${auction.currentPrice}</p>
            <p className="text-sm text-gray-600">Ends: {auction.endTime}</p>
            <Link href={`/auction/${auction.id}`}>
              <button className="bg-green-500 text-white px-4 py-2 mt-2 rounded">
                View / Place Bid
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
