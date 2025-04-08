import type { FC } from 'react';
import Link from 'next/link';
import { Search, Bell, User } from "lucide-react"


const Navbar: FC = () => {
  return (
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
              <div className="relative mr-4">
                <input
                  type="text"
                  placeholder="Search items..."
                  className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-black-400" />
              </div>

              <div className="flex items-center space-x-4">
                <button className="text-gray-700 hover:text-green-500">
                  <Bell className="h-6 w-6" />
                </button>
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
    );
}

export default Navbar;