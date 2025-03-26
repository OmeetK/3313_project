"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, TrendingUp } from "lucide-react"

// Mock data for trending items
const TRENDING_ITEMS = [
  {
    id: 1,
    title: "Premium Wireless Headphones",
    image: "/placeholder.svg?height=200&width=200",
    lastSalePrice: 299,
    priceChange: 12, // percentage increase
  },
  {
    id: 2,
    title: "Limited Edition Graphic Card",
    image: "/placeholder.svg?height=200&width=200",
    lastSalePrice: 899,
    priceChange: 24,
  },
  {
    id: 3,
    title: "Collectible Action Figure",
    image: "/placeholder.svg?height=200&width=200",
    lastSalePrice: 125,
    priceChange: 8,
  },
  {
    id: 4,
    title: "Vintage Vinyl Record",
    image: "/placeholder.svg?height=200&width=200",
    lastSalePrice: 75,
    priceChange: -5,
  },
  {
    id: 5,
    title: "Designer Handbag",
    image: "/placeholder.svg?height=200&width=200",
    lastSalePrice: 450,
    priceChange: 15,
  },
  {
    id: 6,
    title: "Smart Home Assistant",
    image: "/placeholder.svg?height=200&width=200",
    lastSalePrice: 199,
    priceChange: 3,
  },
]

export default function TrendingItems() {
  const [items] = useState(TRENDING_ITEMS)

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Trending Now</h2>
          </div>
          <Link href="/trending" className="text-green-500 hover:text-green-600 flex items-center">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/item/${item.id}`}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="relative h-32 sm:h-40 bg-gray-100">
                <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-contain p-2" />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm text-gray-900 mb-1 truncate">{item.title}</h3>
                <p className="text-sm text-gray-500">Last Sale</p>
                <div className="flex justify-between items-center">
                  <p className="font-bold text-gray-900">${item.lastSalePrice}</p>
                  <span className={`text-xs font-medium ${item.priceChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {item.priceChange >= 0 ? "+" : ""}
                    {item.priceChange}%
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

