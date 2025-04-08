"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Package, Gavel, Tag, Settings, LogOut, Clock, ChevronRight, AlertCircle } from "lucide-react"

// Mock data for user
const USER = {
  id: 1,
  name: "John Doe",
  email: "john.doe@example.com",
  joinDate: "January 2023",
  avatar: "/placeholder.svg?height=100&width=100",
}

// Mock data for bids
const BIDS = [
  {
    id: 1,
    itemId: 101,
    itemTitle: "Vintage Mechanical Watch",
    itemImage: "/placeholder.svg?height=100&width=100",
    bidAmount: 450,
    bidDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    auctionEndDate: new Date(Date.now() + 86400000 * 1), // 1 day from now
    isHighestBidder: true,
    status: "active", // active, won, outbid, ended
  },
  {
    id: 2,
    itemId: 102,
    itemTitle: "Limited Edition Sneakers",
    itemImage: "/placeholder.svg?height=100&width=100",
    bidAmount: 280,
    bidDate: new Date(Date.now() - 86400000 * 3), // 3 days ago
    auctionEndDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
    isHighestBidder: false,
    status: "outbid",
  },
  {
    id: 3,
    itemId: 103,
    itemTitle: "Smartphone",
    itemImage: "/placeholder.svg?height=100&width=100",
    bidAmount: 350,
    bidDate: new Date(Date.now() - 86400000 * 5), // 5 days ago
    auctionEndDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    isHighestBidder: true,
    status: "won",
  },
  {
    id: 4,
    itemId: 104,
    itemTitle: "Antique Wooden Chair",
    itemImage: "/placeholder.svg?height=100&width=100",
    bidAmount: 120,
    bidDate: new Date(Date.now() - 86400000 * 4), // 4 days ago
    auctionEndDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
    isHighestBidder: false,
    status: "ended",
  },
  {
    id: 5,
    itemId: 105,
    itemTitle: "Designer Handbag",
    itemImage: "/placeholder.svg?height=100&width=100",
    bidAmount: 520,
    bidDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
    auctionEndDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
    isHighestBidder: true,
    status: "active",
  },
]

// Mock data for selling items
const SELLING_ITEMS = [
  {
    id: 201,
    title: "Professional DSLR Camera",
    image: "/placeholder.svg?height=100&width=100",
    currentBid: 890,
    startingPrice: 500,
    endDate: new Date(Date.now() + 86400000 * 4), // 4 days from now
    bids: 11,
    watchers: 23,
    status: "active", // active, ended, sold
  },
  {
    id: 202,
    title: "Luxury Wristwatch",
    image: "/placeholder.svg?height=100&width=100",
    currentBid: 1200,
    startingPrice: 800,
    endDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
    bids: 19,

    watchers: 35,
    status: "active",
  },
  {
    id: 203,
    title: "Vintage Vinyl Records Collection",
    image: "/placeholder.svg?height=100&width=100",
    currentBid: 120,
    startingPrice: 50,
    endDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
    bids: 8,
   
    watchers: 12,
    status: "sold",
    soldPrice: 120,
    soldDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
  },
  {
    id: 204,
    title: "Gaming Console",
    image: "/placeholder.svg?height=100&width=100",
    currentBid: 0,
    startingPrice: 250,
    endDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    bids: 0,
    
    watchers: 5,
    status: "ended",
  },
]

// Mock data for purchased items
const PURCHASED_ITEMS = [
  {
    id: 301,
    title: "Smartphone",
    image: "/placeholder.svg?height=100&width=100",
    purchasePrice: 350,
    purchaseDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    seller: "TechGadgets",
    status: "shipped", // pending, shipped, delivered
    trackingNumber: "TRK123456789",
    estimatedDelivery: new Date(Date.now() + 86400000 * 2), // 2 days from now
  },
  {
    id: 302,
    title: "Vintage Vinyl Records Collection",
    image: "/placeholder.svg?height=100&width=100",
    purchasePrice: 120,
    purchaseDate: new Date(Date.now() - 86400000 * 10), // 10 days ago
    seller: "VinylCollector",
    status: "delivered",
    deliveryDate: new Date(Date.now() - 86400000 * 5), // 5 days ago
  },
  {
    id: 303,
    title: "Rare Collectible Figurine",
    image: "/placeholder.svg?height=100&width=100",
    purchasePrice: 180,
    purchaseDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
    seller: "CollectiblesExpert",
    status: "pending",
    estimatedShipping: new Date(Date.now() + 86400000 * 1), // 1 day from now
  },
]

type TabType = "bids" | "selling" | "purchased"

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<TabType>("bids")

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()

    if (diff <= 0) return "Ended"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h left`
    return `${hours}h left`
  }

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800"
      case "won":
        return "bg-green-100 text-green-800"
      case "outbid":
        return "bg-red-100 text-red-800"
      case "ended":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSellingStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800"
      case "sold":
        return "bg-green-100 text-green-800"
      case "ended":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPurchaseStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                    <Image src={USER.avatar || "/placeholder.svg"} alt={USER.name} fill className="object-cover" />
                  </div>
                  <div className="ml-4">
                    <h2 className="font-bold text-gray-900">{USER.name}</h2>
                    <p className="text-sm text-gray-500">Member since {USER.joinDate}</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab("bids")}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "bids" ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Gavel className="mr-3 h-5 w-5" />
                    My Bids
                  </button>
                  <button
                    onClick={() => setActiveTab("selling")}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "selling" ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Tag className="mr-3 h-5 w-5" />
                    Selling
                  </button>
                  
                  <Link
                    href="/logout"
                    className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                  </Link>
                </nav>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Account Summary</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Active Bids</span>
                    <span className="text-sm font-medium text-gray-900">
                      {BIDS.filter((bid) => bid.status === "active").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Items Won</span>
                    <span className="text-sm font-medium text-gray-900">
                      {BIDS.filter((bid) => bid.status === "won").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Active Listings</span>
                    <span className="text-sm font-medium text-gray-900">
                      {SELLING_ITEMS.filter((item) => item.status === "active").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Items Sold</span>
                    <span className="text-sm font-medium text-gray-900">
                      {SELLING_ITEMS.filter((item) => item.status === "sold").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* My Bids Tab */}
            {activeTab === "bids" && (
              <div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900">My Bids</h1>
                    <p className="text-sm text-gray-500 mt-1">Track all your auction bids in one place</p>
                  </div>

                  {BIDS.length === 0 ? (
                    <div className="p-6 text-center">
                      <Gavel className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No bids yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Start bidding on items you're interested in.</p>
                      <div className="mt-6">
                        <Link
                          href="/browse"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600"
                        >
                          Browse Auctions
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Item
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Bid Amount
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Bid Date
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Status
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Time Left
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {BIDS.map((bid) => (
                            <tr key={bid.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                    <Image
                                      src={bid.itemImage || "/placeholder.svg"}
                                      alt={bid.itemTitle}
                                      width={40}
                                      height={40}
                                      className="h-10 w-10 rounded-md object-cover"
                                    />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                      {bid.itemTitle}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {bid.isHighestBidder && bid.status === "active" ? (
                                        <span className="text-green-600 font-medium">You're the highest bidder</span>
                                      ) : bid.status === "outbid" ? (
                                        <span className="text-red-600 font-medium">You've been outbid</span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">${bid.bidAmount}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{formatDate(bid.bidDate)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBidStatusColor(bid.status)}`}
                                >
                                  {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {bid.status === "active" ? (
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 text-red-500 mr-1" />
                                      {formatTimeRemaining(bid.auctionEndDate)}
                                    </div>
                                  ) : bid.status === "won" ? (
                                    <span className="text-green-600">Won on {formatDate(bid.auctionEndDate)}</span>
                                  ) : (
                                    <span>Ended {formatDate(bid.auctionEndDate)}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link href={`/auction/${bid.itemId}`} className="text-green-500 hover:text-green-600">
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Active Bids Summary
                {BIDS.filter((bid) => bid.status === "active").length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">Active Bids Summary</h2>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="space-y-4">
                        {BIDS.filter((bid) => bid.status === "active").map((bid) => (
                          <div key={bid.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Image
                                src={bid.itemImage || "/placeholder.svg"}
                                alt={bid.itemTitle}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{bid.itemTitle}</p>
                                <p className="text-sm text-gray-500">Bid: ${bid.bidAmount}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="text-right mr-4">
                                <p className="text-sm font-medium text-red-500">
                                  {formatTimeRemaining(bid.auctionEndDate)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {bid.isHighestBidder ? "Highest bidder" : "Not highest bidder"}
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )} */}
              </div>
            )}

            {/* Selling Tab */}
            {activeTab === "selling" && (
              <div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                  <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">My Listings</h1>
                      <p className="text-sm text-gray-500 mt-1">Manage your auction listings</p>
                    </div>
                    <Link
                      href="/sell"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600"
                    >
                      List New Item
                    </Link>
                  </div>

                  {SELLING_ITEMS.length === 0 ? (
                    <div className="p-6 text-center">
                      <Tag className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No listings yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Start selling by listing your first item.</p>
                      <div className="mt-6">
                        <Link
                          href="/sell"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600"
                        >
                          List an Item
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Item
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Price
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Bids
                            </th>
                            
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Status
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              End Date
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {SELLING_ITEMS.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                    <Image
                                      src={item.image || "/placeholder.svg"}
                                      alt={item.title}
                                      width={40}
                                      height={40}
                                      className="h-10 w-10 rounded-md object-cover"
                                    />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {item.status === "sold" ? (
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">${item.soldPrice}</div>
                                    <div className="text-xs text-gray-500">Sold for</div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.currentBid > 0 ? `$${item.currentBid}` : "No bids"}
                                    </div>
                                    <div className="text-xs text-gray-500">Starting: ${item.startingPrice}</div>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{item.bids}</div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSellingStatusColor(item.status)}`}
                                >
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {item.status === "active" ? (
                                  <div className="text-sm text-gray-500">
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 text-red-500 mr-1" />
                                      {formatTimeRemaining(item.endDate)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">{formatDate(item.endDate)}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link href={`/auction/${item.id}`} className="text-green-500 hover:text-green-600 mr-4">
                                  View
                                </Link>
                                {item.status === "active" && (
                                  <Link href={`/edit-listing/${item.id}`} className="text-gray-500 hover:text-gray-600">
                                    Edit
                                  </Link>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Selling Performance */}
                {SELLING_ITEMS.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">Selling Performance</h2>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-500">Active Listings</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {SELLING_ITEMS.filter((item) => item.status === "active").length}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-500">Items Sold</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {SELLING_ITEMS.filter((item) => item.status === "sold").length}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-500">Total Revenue</p>
                          <p className="text-2xl font-bold text-gray-900">
                            $
                            {SELLING_ITEMS.filter((item) => item.status === "sold").reduce(
                              (total, item) => total + (item.soldPrice || 0),
                              0,
                            )}
                          </p>
                        </div>
                      </div>

                      {SELLING_ITEMS.filter((item) => item.status === "active").length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-medium text-gray-900 mb-3">Active Listings Overview</h3>
                          <div className="space-y-4">
                            {SELLING_ITEMS.filter((item) => item.status === "active").map((item) => (
                              <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Image
                                    src={item.image || "/placeholder.svg"}
                                    alt={item.title}
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 rounded-md object-cover"
                                  />
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                    <p className="text-sm text-gray-500">
                                      {item.bids > 0 ? `Current bid: $${item.currentBid}` : "No bids yet"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <div className="text-right mr-4">
                                    <p className="text-sm font-medium text-red-500">
                                      {formatTimeRemaining(item.endDate)}
                                    </p>
                                    <p className="text-xs text-gray-500">{item.watchers} watching</p>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-gray-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Purchased Tab */}
            {activeTab === "purchased" && (
              <div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900">Purchased Items</h1>
                    <p className="text-sm text-gray-500 mt-1">Track your auction wins and purchases</p>
                  </div>

                  {PURCHASED_ITEMS.length === 0 ? (
                    <div className="p-6 text-center">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Items you win in auctions will appear here.</p>
                      <div className="mt-6">
                        <Link
                          href="/browse"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600"
                        >
                          Browse Auctions
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Item
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Price
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Purchase Date
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Seller
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Status
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {PURCHASED_ITEMS.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                    <Image
                                      src={item.image || "/placeholder.svg"}
                                      alt={item.title}
                                      width={40}
                                      height={40}
                                      className="h-10 w-10 rounded-md object-cover"
                                    />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">${item.purchasePrice}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{formatDate(item.purchaseDate)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{item.seller}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPurchaseStatusColor(item.status)}`}
                                >
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link href={`/purchase/${item.id}`} className="text-green-500 hover:text-green-600">
                                  Details
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Shipping Updates */}
                {PURCHASED_ITEMS.filter((item) => item.status === "shipped").length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">Shipping Updates</h2>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="space-y-4">
                        {PURCHASED_ITEMS.filter((item) => item.status === "shipped").map((item) => (
                          <div key={item.id} className="flex items-start p-4 bg-blue-50 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                              <h3 className="text-sm font-medium text-blue-800">Shipping Update for {item.title}</h3>
                              <p className="text-sm text-blue-700 mt-1">
                                {/* Your item is on the way! Expected delivery: {formatDate(item.estimatedDelivery)} */}
                              </p>
                              <div className="mt-2">
                                <p className="text-xs text-blue-700">
                                  Tracking number: <span className="font-medium">{item.trackingNumber}</span>
                                </p>
                              </div>
                              <div className="mt-3">
                                <Link
                                  href={`/track-shipment/${item.trackingNumber}`}
                                  className="text-xs font-medium text-blue-700 hover:text-blue-600"
                                >
                                  Track shipment →
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Purchases */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Purchase History</h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="space-y-6">
                      {PURCHASED_ITEMS.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.title}
                              width={60}
                              height={60}
                              className="h-16 w-16 rounded-md object-cover"
                            />
                            <div className="ml-4">
                              <h3 className="text-base font-medium text-gray-900">{item.title}</h3>
                              <p className="text-sm text-gray-500">Purchased on {formatDate(item.purchaseDate)}</p>
                              <p className="text-sm font-medium text-gray-900 mt-1">${item.purchasePrice}</p>
                            </div>
                          </div>
                          <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPurchaseStatusColor(item.status)}`}
                            >
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                            {item.status === "delivered" && (
                              <Link
                                href={`/review/${item.id}`}
                                className="text-sm text-green-500 hover:text-green-600 mt-2"
                              >
                                Leave a review
                              </Link>
                            )}
                            {item.status === "shipped" && (
                              <p className="text-xs text-gray-500 mt-2">
                                {/* Est. delivery: {formatDate(item.estimatedDelivery)} */}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}