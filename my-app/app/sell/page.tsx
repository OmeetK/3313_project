"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Upload, Info, HelpCircle } from "lucide-react"

export default function SellPage() {
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    condition: "",
    startingPrice: "",
    reservePrice: "",
    description: "",
    duration: "7",
    shippingOption: "seller",
  })
  const [currentStep, setCurrentStep] = useState(1)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // In a real app, you would upload to a server/blob storage
      // Here we're just creating local URLs for preview
      const newImages = Array.from(e.target.files).map((file) => URL.createObjectURL(file))
      setImages((prev) => [...prev, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would connect to your C server to create the auction
    console.log("Creating auction with:", { ...formData, images })
    alert("Your item has been listed for auction! In a real app, this would connect to your C server.")
  }

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-green-500 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">List an Item for Auction</h1>
            <p className="text-gray-600 mt-2">Fill out the details below to start selling your item</p>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= 1 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  1
                </div>
                <div className="ml-2 text-sm font-medium">Item Details</div>
              </div>
              <div className={`flex-grow mx-4 h-1 ${currentStep >= 2 ? "bg-green-500" : "bg-gray-200"}`}></div>
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= 2 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  2
                </div>
                <div className="ml-2 text-sm font-medium">Images & Description</div>
              </div>
              <div className={`flex-grow mx-4 h-1 ${currentStep >= 3 ? "bg-green-500" : "bg-gray-200"}`}></div>
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= 3 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  3
                </div>
                <div className="ml-2 text-sm font-medium">Pricing & Shipping</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Item Details */}
            {currentStep === 1 && (
              <div className="p-6">
                <div className="grid gap-6 mb-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Item Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Vintage Mechanical Watch"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select a category</option>
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="watches">Watches</option>
                      <option value="collectibles">Collectibles</option>
                      <option value="home">Home & Garden</option>
                      <option value="cameras">Cameras</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                      Item Condition *
                    </label>
                    <select
                      id="condition"
                      name="condition"
                      required
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select condition</option>
                      <option value="new">New</option>
                      <option value="like-new">Like New</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Images & Description */}
            {currentStep === 2 && (
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Images *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="images"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label htmlFor="images" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Drag and drop images here, or click to browse</p>
                      <p className="text-xs text-gray-500 mt-1">Upload up to 8 images (PNG, JPG, WEBP)</p>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      {images.map((img, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={img || "/placeholder.svg"}
                            alt={`Item image ${index + 1}`}
                            width={100}
                            height={100}
                            className="h-24 w-24 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Item Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Describe your item in detail. Include information about brand, model, size, color, condition, authenticity, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 50 characters. Detailed descriptions help your item sell faster.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Pricing & Shipping */}
            {currentStep === 3 && (
              <div className="p-6">
                <div className="grid gap-6 mb-6">
                  <div>
                    <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Starting Price ($) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="number"
                        id="startingPrice"
                        name="startingPrice"
                        required
                        min="1"
                        step="0.01"
                        value={formData.startingPrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This is the minimum bid for your auction</p>
                  </div>

                  <div>
                    <label htmlFor="reservePrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Reserve Price ($) <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="number"
                        id="reservePrice"
                        name="reservePrice"
                        min="0"
                        step="0.01"
                        value={formData.reservePrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex items-start mt-1">
                      <Info className="h-4 w-4 text-gray-400 mr-1 mt-0.5" />
                      <p className="text-xs text-gray-500">
                        A reserve price is the minimum amount you're willing to accept. If the bidding doesn't reach
                        this amount, you're not obligated to sell.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                      Auction Duration *
                    </label>
                    <select
                      id="duration"
                      name="duration"
                      required
                      value={formData.duration}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="3">3 days</option>
                      <option value="5">5 days</option>
                      <option value="7">7 days</option>
                      <option value="10">10 days</option>
                      <option value="14">14 days</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="shippingOption" className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping *
                    </label>
                    <select
                      id="shippingOption"
                      name="shippingOption"
                      required
                      value={formData.shippingOption}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="seller">Seller pays shipping</option>
                      <option value="buyer">Buyer pays shipping</option>
                      <option value="local">Local pickup only</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Seller Fees</h4>
                      <p className="text-sm text-blue-600 mt-1">
                        AuctionX charges a 10% fee on successful sales. You'll receive 90% of the final bid amount.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    List Item for Auction
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

