"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"


// Mock data for featured auctions
const FEATURED_AUCTIONS = [
  {
    id: 1,
    title: "Vintage Mechanical Watch",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 450,
    endTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
    bids: 18,
  },
  {
    id: 2,
    title: "Limited Edition Sneakers",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 320,
    endTime: new Date(Date.now() + 86400000 * 1), // 1 day from now
    bids: 24,
  },
  {
    id: 3,
    title: "Rare Collectible Figurine",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 180,
    endTime: new Date(Date.now() + 86400000 * 3), // 3 days from now
    bids: 12,
  },
  {
    id: 4,
    title: "Vintage Camera",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 275,
    endTime: new Date(Date.now() + 86400000 * 2.5), // 2.5 days from now
    bids: 9,
  },
]

export default function FeaturedAuctions() {
  const [auctions] = useState(FEATURED_AUCTIONS)

  // Format time remaining
  const formatTimeRemaining = (endTime: Date) => {
    const now = new Date()
    const diff = endTime.getTime() - now.getTime()

    if (diff <= 0) return "Ended"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Auctions</h2>
          <Link href="/auctions" className="text-green-500 hover:text-green-600 flex items-center">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {auctions.map((auction) => (
            <div
              key={auction.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >

              <Link href={`/auction/${auction.id}`}>
                <div className="relative h-48 bg-gray-100">
                  <Image src={auction.image || "/placeholder.svg"} alt={auction.title} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1 truncate">{auction.title}</h3>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-sm text-gray-500">Current Bid</p>
                      <p className="text-lg font-bold text-gray-900">${auction.currentBid}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{auction.bids} bids</p>
                      <p className="text-sm font-medium text-red-500">{formatTimeRemaining(auction.endTime)}</p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link
                href={`/auction/${auction.id}`}
                className="w-full mt-2 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md text-center block transition-colors"
              >
                Place Bid
              </Link>
            </div>
            
          ))}
        </div>
      </div>
    </section>
  )
}



