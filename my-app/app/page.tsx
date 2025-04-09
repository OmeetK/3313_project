import Link from "next/link"
import { Search, Bell, User } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-green-500">
                AuctionX
              </Link>
              <nav className="hidden md:ml-10 md:flex md:space-x-8">
                <Link href="/browse" className="text-gray-700 hover:text-green-500">
                  Browse
                </Link>
                <Link href="/sell" className="text-gray-700 hover:text-green-500">
                  Sell
                </Link>
              </nav>
            </div>

            <div className="flex items-center">
              

              <div className="flex items-center space-x-4">
                
                <Link href="/profile" className="text-gray-700 hover:text-green-500">
                  <User className="h-6 w-6" />
                </Link>
                <Link
                  href="/auth/register"
                  className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-600"
                >
                  Login/Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Buy and Sell Authentic Items at Market Price
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of users in the most trusted auction marketplace
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/browse"
                  className="px-8 py-3 text-base font-medium rounded-md text-white bg-green-500 hover:bg-green-600"
                >
                  Shop Now
                </Link>
                <Link
                  href="/sell"
                  className="px-8 py-3 text-base font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                >
                  Start Selling
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-3 text-center text-gray-400">
        <p>&copy; {new Date().getFullYear()} AuctionX. All rights reserved.</p>
      </footer>
    </div>
  )
}
