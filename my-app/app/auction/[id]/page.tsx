"use client";

import React, { useState, useEffect, FormEvent, use } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import websocketService from "@/app/lib/websocket";
import Navbar from "@/app/Navbar"


interface Bid {
  username: string;
  amount: number;
  time: string;
}

interface AuctionData {
  id: number;
  title: string;
  currentBid: number;
  endTime: string;
  bids: Bid[];
}

export default function AuctionDetailPage({ params }: { params: { id: string } }) {
  // Unwrap the params Promise using React.use()
  const unwrappedParams = use(params as any);
  const auctionId = unwrappedParams.id;
  
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Connect to the WebSocket once
    websocketService.connect().then(() => {
      // Request the auction details
      const cmd = `GET_AUCTION ${auctionId}`;
      websocketService.sendCommand(cmd);
    });

    const handleMessage = (data: any) => {
      if (data.type === "server") {
        if (data.response.startsWith("AUCTION_DETAILS")) {
          // parse out the JSON
          const jsonPart = data.response.replace("AUCTION_DETAILS", "").trim();
          try {
            const auctionObj: AuctionData = JSON.parse(jsonPart);
            setAuction(auctionObj);
            setBidAmount(auctionObj.currentBid + 10); // start 10 above current
          } catch (err) {
            console.error("Failed to parse auction details:", err);
          }
        } else if (data.response.includes("Bid placed successfully")) {
          // Force re-fetch the auction to see the updated currentBid + new bid
          const cmd = `GET_AUCTION ${auctionId}`;
          websocketService.sendCommand(cmd);
        } else if (data.response.startsWith("Bid failed:")) {
          setErrorMessage(data.response);
        } else if (data.response.startsWith("Auction not found")) {
          setErrorMessage("Auction not found!");
        }
      }
    };

    websocketService.on("message", handleMessage);

    // Cleanup if your websocketService supports off() / remove listener
    // return () => { websocketService.off("message", handleMessage) }
  }, [auctionId]);

  const handleBid = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!auction) {
      setErrorMessage("No auction loaded.");
      return;
    }

    // Example BID command: "BID 27 500"
    const cmd = `BID ${auction.id} ${bidAmount}`;
    websocketService.sendCommand(cmd);
  };

  if (!auction) {
    return <div className="p-6">Loading auction data...</div>;
  }

  return (
    <div className="p-6">
      <Navbar />
      <h1 className="text-2xl font-bold mb-4">{auction.title}</h1>
      <p className="mb-2">Current bid: ${auction.currentBid}</p>
      <p className="mb-2">Ends: {auction.endTime}</p>

      <form onSubmit={handleBid} className="mb-4">
        <label className="block mb-2">Your Bid:</label>
        <input
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(Number(e.target.value))}
          min={auction.currentBid + 10}
          className="border p-2 mr-2"
        />
        <button className="bg-green-500 text-white px-4 py-2 rounded">
          Place Bid
        </button>
      </form>

      {errorMessage && (
        <div className="text-red-500 mb-4">{errorMessage}</div>
      )}

      <h2 className="text-xl font-semibold mt-8">Bid History</h2>
      <table className="mt-2 w-full border">
        <thead className="border-b">
          <tr>
            <th className="py-2 px-4 text-left">Bidder</th>
            <th className="py-2 px-4 text-left">Amount</th>
            <th className="py-2 px-4 text-left">Time</th>
          </tr>
        </thead>
        <tbody>
          {auction.bids.map((b, idx) => (
            <tr key={idx} className="border-b">
              <td className="py-2 px-4">{b.username || "Unknown"}</td>
              <td className="py-2 px-4">${b.amount}</td>
              <td className="py-2 px-4">{b.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}