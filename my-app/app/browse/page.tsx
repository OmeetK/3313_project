"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Filter, ChevronDown, Grid, List } from "lucide-react"

// Mock data for auction items
const AUCTION_ITEMS = [
  {
    id: 1,
    title: "Vintage Mechanical Watch",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 450,
    endTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
    bids: 18,
    category: "watches",
    condition: "excellent",
  },
  {
    id: 2,
    title: "Limited Edition Sneakers",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 320,
    endTime: new Date(Date.now() + 86400000 * 1), // 1 day from now
    bids: 24,
    category: "fashion",
    condition: "new",
  },
  {
    id: 3,
    title: "Rare Collectible Figurine",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 180,
    endTime: new Date(Date.now() + 86400000 * 3), // 3 days from now
    bids: 12,
    category: "collectibles",
    condition: "good",
  },
  {
    id: 4,
    title: "Vintage Camera",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 275,
    endTime: new Date(Date.now() + 86400000 * 2.5), // 2.5 days from now
    bids: 9,
    category: "cameras",
    condition: "fair",
  },
  {
    id: 5,
    title: "Gaming Console",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 399,
    endTime: new Date(Date.now() + 86400000 * 4), // 4 days from now
    bids: 32,
    category: "electronics",
    condition: "like-new",
  },
  {
    id: 6,
    title: "Antique Wooden Chair",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 150,
    endTime: new Date(Date.now() + 86400000 * 5), // 5 days from now
    bids: 7,
    category: "home",
    condition: "good",
  },
  {
    id: 7,
    title: "Designer Handbag",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 520,
    endTime: new Date(Date.now() + 86400000 * 1.5), // 1.5 days from now
    bids: 15,
    category: "fashion",
    condition: "excellent",
  },
  {
    id: 8,
    title: "Smartphone",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 350,
    endTime: new Date(Date.now() + 86400000 * 3.5), // 3.5 days from now
    bids: 21,
    category: "electronics",
    condition: "good",
  },
  {
    id: 9,
    title: "Vintage Vinyl Records Collection",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 120,
    endTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
    bids: 8,
    category: "collectibles",
    condition: "good",
  },
  {
    id: 10,
    title: "Professional DSLR Camera",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 890,
    endTime: new Date(Date.now() + 86400000 * 6), // 6 days from now
    bids: 11,
    category: "cameras",
    condition: "excellent",
  },
  {
    id: 11,
    title: "Luxury Wristwatch",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 1200,
    endTime: new Date(Date.now() + 86400000 * 4), // 4 days from now
    bids: 19,
    category: "watches",
    condition: "new",
  },
  {
    id: 12,
    title: "Outdoor Patio Set",
    image: "/placeholder.svg?height=300&width=300",
    currentBid: 450,
    endTime: new Date(Date.now() + 86400000 * 7), // 7 days from now
    bids: 5,
    category: "home",
    condition: "good",
  },
]

// Categories for filtering
const CATEGORIES = [
  { id: "all", name: "All Categories" },
  { id: "electronics", name: "Electronics" },
  { id: "fashion", name: "Fashion" },
  { id: "watches", name: "Watches" },
  { id: "collectibles", name: "Collectibles" },
  { id: "home", name: "Home & Garden" },
  { id: "cameras", name: "Cameras" },
]

// Conditions for filtering
const CONDITIONS = [
  { id: "all", name: "All Conditions" },
  { id: "new", name: "New" },
  { id: "like-new", name: "Like New" },
  { id: "excellent", name: "Excellent" },
  { id: "good", name: "Good" },
  { id: "fair", name: "Fair" },
  { id: "poor", name: "Poor" },
]

export default function BrowsePage() {
  const [items, setItems] = useState(AUCTION_ITEMS)
  const [filteredItems, setFilteredItems] = useState(AUCTION_ITEMS)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedCondition, setSelectedCondition] = useState("all")
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })
  const [sortBy, setSortBy] = useState("ending-soon")
  const [viewMode, setViewMode] = useState("grid") // grid or list
  const [showFilters, setShowFilters] = useState(false)

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

  // Apply filters and sorting
  useEffect(() => {
    let result = [...items]

    // Apply search filter
    if (searchQuery) {
      result = result.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category === selectedCategory)
    }

    // Apply condition filter
    if (selectedCondition !== "all") {
      result = result.filter((item) => item.condition === selectedCondition)
    }

    // Apply price range filter
    if (priceRange.min) {
      result = result.filter((item) => item.currentBid >= Number(priceRange.min))
    }
    if (priceRange.max) {
      result = result.filter((item) => item.currentBid <= Number(priceRange.max))
    }

    // Apply sorting
    switch (sortBy) {
      case "ending-soon":
        result.sort((a, b) => a.endTime.getTime() - b.endTime.getTime())
        break
      case "price-low":
        result.sort((a, b) => a.currentBid - b.currentBid)
        break
      case "price-high":
        result.sort((a, b) => b.currentBid - a.currentBid)
        break
      case "most-bids":
        result.sort((a, b) => b.bids - a.bids)
        break
      default:
        break
    }

    setFilteredItems(result)
  }, [items, searchQuery, selectedCategory, selectedCondition, priceRange, sortBy])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // The search is already applied via the useEffect
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPriceRange((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedCondition("all")
    setPriceRange({ min: "", max: "" })
    setSortBy("ending-soon")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-0">Browse Auctions</h1>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="relative flex-grow">
              <input
                type="text"
                placeholder="Search auctions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>

            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-green-500 text-white" : "bg-white text-gray-700"}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-green-500 text-white" : "bg-white text-gray-700"}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <div
            className={`md:w-64 bg-white rounded-lg border border-gray-200 overflow-hidden ${showFilters ? "block" : "hidden md:block"}`}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="font-medium text-gray-900">Filters</h2>
                <button onClick={clearFilters} className="text-sm text-green-500 hover:text-green-600">
                  Clear all
                </button>
              </div>
            </div>

            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Category</h3>
              <div className="space-y-2">
                {CATEGORIES.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`category-${category.id}`}
                      name="category"
                      value={category.id}
                      checked={selectedCategory === category.id}
                      onChange={() => setSelectedCategory(category.id)}
                      className="h-4 w-4 text-green-500 focus:ring-green-500 border-gray-300"
                    />
                    <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Condition</h3>
              <div className="space-y-2">
                {CONDITIONS.map((condition) => (
                  <div key={condition.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`condition-${condition.id}`}
                      name="condition"
                      value={condition.id}
                      checked={selectedCondition === condition.id}
                      onChange={() => setSelectedCondition(condition.id)}
                      className="h-4 w-4 text-green-500 focus:ring-green-500 border-gray-300"
                    />
                    <label htmlFor={`condition-${condition.id}`} className="ml-2 text-sm text-gray-700">
                      {condition.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="min" className="block text-xs text-black-500 mb-1">
                    Min ($)
                  </label>
                  <input
                    type="number"
                    id="min"
                    name="min"
                    min="0"
                    value={priceRange.min}
                    onChange={handlePriceChange}
                    placeholder="Min"
                    className="w-full px-3 py-1 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="max" className="block text-xs text-black-500 mb-1">
                    Max ($)
                  </label>
                  <input
                    type="number"
                    id="max"
                    name="max"
                    min="0"
                    value={priceRange.max}
                    onChange={handlePriceChange}
                    placeholder="Max"
                    className="w-full px-3 py-1 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="ending-soon">Ending Soon</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="most-bids">Most Bids</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-green-500 text-white font-medium rounded-md hover:bg-green-600"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">{filteredItems.length} results</p>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">Sort by:</span>
                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="appearance-none bg-transparent pr-8 py-1 text-sm text-gray-900 focus:outline-none"
                        >
                          <option value="ending-soon">Ending Soon</option>
                          <option value="price-low">Price: Low to High</option>
                          <option value="price-high">Price: High to Low</option>
                          <option value="most-bids">Most Bids</option>
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                      >
                        <Link href={`/auction/${item.id}`}>
                          <div className="relative h-48 bg-gray-100">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium text-gray-900 mb-1 truncate">{item.title}</h3>
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <p className="text-sm text-gray-500">Current Bid</p>
                                <p className="text-lg font-bold text-gray-900">${item.currentBid}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">{item.bids} bids</p>
                                <p className="text-sm font-medium text-red-500">{formatTimeRemaining(item.endTime)}</p>
                              </div>
                            </div>
                            <button className="w-full mt-2 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors">
                              Place Bid
                            </button>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                      >
                        <Link href={`/auction/${item.id}`} className="flex">
                          <div className="relative h-32 w-32 sm:w-48 bg-gray-100 flex-shrink-0">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <p className="text-sm text-gray-500">Current Bid</p>
                                  <p className="text-lg font-bold text-gray-900">${item.currentBid}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">{item.bids} bids</p>
                                  <p className="text-sm font-medium text-red-500">
                                    {formatTimeRemaining(item.endTime)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-gray-500 mt-2">
                                <span className="capitalize">{item.condition}</span>
                                <span className="mx-2">•</span>
                                <span className="capitalize">{item.category}</span>
                              </div>
                            </div>
                            <div className="mt-4 sm:mt-0 sm:self-end">
                              <button className="py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors">
                                Place Bid
                              </button>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

