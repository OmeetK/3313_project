"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Clock, User, Eye, Heart, Share2 } from "lucide-react"

// Mock auction data
const auctionData = {
  id: 1,
  title: "Vintage Mechanical Watch",
  description:
    "Rare vintage mechanical watch in excellent condition. Features a stainless steel case, automatic movement, and genuine leather strap. This collector's item has been well maintained and is fully functional.",
  image: "/placeholder.svg?height=600&width=600",
  currentBid: 450,
  minBidIncrement: 10,
  startingPrice: 200,
  endTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
  seller: {
    id: 101,
    name: "VintageCollector",
    rating: 4.9,
    totalSales: 152,
  },
  bids: [
    { id: 1, userId: 201, username: "WatchFan22", amount: 450, time: new Date(Date.now() - 3600000 * 2) },
    { id: 2, userId: 202, username: "CollectiblesExpert", amount: 425, time: new Date(Date.now() - 3600000 * 5) },
    { id: 3, userId: 203, username: "TimePiece", amount: 400, time: new Date(Date.now() - 3600000 * 8) },
    { id: 4, userId: 204, username: "HorologyLover", amount: 350, time: new Date(Date.now() - 3600000 * 12) },
    { id: 5, userId: 205, username: "WatchCollector", amount: 300, time: new Date(Date.now() - 3600000 * 24) },
  ],
  views: 342,
  watchers: 28,
}

export default function AuctionDetailPage({ params }: { params: { id: string } }) {
  const [auction] = useState(auctionData)
  const [bidAmount, setBidAmount] = useState(auction.currentBid + auction.minBidIncrement)
  const [timeLeft, setTimeLeft] = useState("")
  const [isWatching, setIsWatching] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const diff = auction.endTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("Auction ended")
        clearInterval(timer)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }, 1000)

    return () => clearInterval(timer)
  }, [auction.endTime])

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would connect to your C server to place a bid
    alert(`Bid of $${bidAmount} would be sent to your C server`)
    // In a real app, you would update the auction state after a successful bid
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Link href="/" className="inline-flex items-center text-green-500 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to listings
        </Link>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* Left column - Image */}
            <div className="relative h-[400px] bg-gray-100 rounded-lg overflow-hidden">
              <Image src={auction.image || "/placeholder.svg"} alt={auction.title} fill className="object-contain" />
            </div>

            {/* Right column - Auction details */}
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{auction.title}</h1>

              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Eye className="h-4 w-4 mr-1" />
                <span>{auction.views} views</span>
                <span className="mx-2">•</span>
                <User className="h-4 w-4 mr-1" />
                <span>{auction.watchers} watching</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500">Current bid:</span>
                  <span className="text-2xl font-bold text-gray-900">${auction.currentBid}</span>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center text-red-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{timeLeft}</span>
                  </div>
                  <span className="text-gray-500">{auction.bids.length} bids</span>
                </div>

                <form onSubmit={handleBidSubmit}>
                  <div className="flex mb-3">
                    <div className="relative flex-grow">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="number"
                        min={auction.currentBid + auction.minBidIncrement}
                        step={auction.minBidIncrement}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-500 text-white font-medium rounded-r-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Place Bid
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Enter ${auction.currentBid + auction.minBidIncrement} or more</p>
                </form>
              </div>

              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setIsWatching(!isWatching)}
                  className={`flex items-center px-4 py-2 rounded-md border ${
                    isWatching ? "bg-red-50 border-red-200 text-red-500" : "border-gray-300 text-gray-700"
                  }`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isWatching ? "fill-current" : ""}`} />
                  {isWatching ? "Watching" : "Watch"}
                </button>
                <button className="flex items-center px-4 py-2 rounded-md border border-gray-300 text-gray-700">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium text-gray-900 mb-2">Seller Information</h3>
                <div className="flex items-center">
                  <div className="bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium">{auction.seller.name}</p>
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span>
                        {auction.seller.rating} ({auction.seller.totalSales} sales)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs section */}
          <div className="border-t border-gray-200">
            <div className="flex border-b border-gray-200">
              <button className="px-6 py-3 border-b-2 border-green-500 text-green-500 font-medium">Details</button>
              <button className="px-6 py-3 text-gray-500 font-medium">Bid History</button>
              <button className="px-6 py-3 text-gray-500 font-medium">Shipping</button>
            </div>

            <div className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Item Description</h3>
              <p className="text-gray-700 mb-6">{auction.description}</p>

              <h3 className="font-medium text-gray-900 mb-4">Bid History</h3>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bidder
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auction.bids.map((bid) => (
                      <tr key={bid.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bid.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${bid.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(bid.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

