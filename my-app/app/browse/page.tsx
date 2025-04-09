"use client";

import { useState, useEffect, useCallback, useRef } from "react"
import Navbar from "../Navbar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Filter, ChevronDown, Grid, List, AlertCircle, Camera, RefreshCw, X } from "lucide-react"
import Image from "next/image"
import websocketService from '../lib/websocket' // Import the WebSocket service

// Types for our auction data
interface AuctionItem {
  id: number;
  title: string;
  currentBid: number;
  endTime: Date;
  bids: number;
  category: string;
  condition: string;
  imageUrl?: string; // Image support for auctions
  description?: string;
  seller?: string;
}

// Modal types
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Constants
const CATEGORIES = [
  { id: "all", name: "All Categories" },
  { id: "electronics", name: "Electronics" },
  { id: "fashion", name: "Fashion" },
  { id: "watches", name: "Watches" },
  { id: "collectibles", name: "Collectibles" },
  { id: "home", name: "Home & Garden" },
  { id: "cameras", name: "Cameras" },
]

const CONDITIONS = [
  { id: "all", name: "All Conditions" },
  { id: "new", name: "New" },
  { id: "like-new", name: "Like New" },
  { id: "excellent", name: "Excellent" },
  { id: "good", name: "Good" },
  { id: "fair", name: "Fair" },
  { id: "poor", name: "Poor" },
]

// Default image if no image is available
const DEFAULT_IMAGE = "/placeholder-image.png"

// Connection constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 seconds
const REFRESH_INTERVAL = 60000; // Refresh data every minute

// Mock data for development if server is not available
const MOCK_AUCTIONS = [
  {
    id: 1,
    title: "Vintage Camera",
    currentBid: 129.99,
    endTime: new Date(Date.now() + 86400000), // 24 hours from now
    bids: 12,
    category: "cameras",
    condition: "excellent",
    imageUrl: "/placeholder-image.png",
    description: "A beautiful vintage camera in excellent working condition. Comes with the original leather case.",
    seller: "vintage_collector"
  },
  {
    id: 2,
    title: "Designer Watch",
    currentBid: 249.99,
    endTime: new Date(Date.now() + 172800000), // 48 hours from now
    bids: 8,
    category: "watches",
    condition: "new",
    imageUrl: "/placeholder-image.png",
    description: "Brand new designer watch, never worn. Original box and papers included.",
    seller: "luxury_items"
  },
  {
    id: 3,
    title: "Smartphone",
    currentBid: 199.99,
    endTime: new Date(Date.now() + 43200000), // 12 hours from now
    bids: 15,
    category: "electronics",
    condition: "good",
    imageUrl: "/placeholder-image.png",
    description: "Latest model smartphone in good condition. Minor scratches on the back panel.",
    seller: "tech_deals"
  },
  {
    id: 4,
    title: "Antique Vase",
    currentBid: 89.99,
    endTime: new Date(Date.now() + 129600000), // 36 hours from now
    bids: 5,
    category: "collectibles", 
    condition: "fair",
    imageUrl: "/placeholder-image.png",
    description: "Antique ceramic vase from the early 20th century. Some visible wear and a small chip on the rim.",
    seller: "antiques_forever"
  }
];

// Simple modal component for quick details
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function BrowsePage() {
  const router = useRouter();
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<AuctionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("ending-soon");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(new Date()); // For live time updates
  const [useMockData, setUseMockData] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState<AuctionItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<number, boolean>>({});
  const [usingBrowseAccount, setUsingBrowseAccount] = useState(false);
  
  // Refs
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update time every 30s
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Set up auto-refresh timer
  useEffect(() => {
    if (!useMockData && connected) {
      // Set up periodic refresh
      refreshTimerRef.current = setInterval(() => {
        console.log('Auto-refreshing auction data...');
        refreshAuctions(false); // Silent refresh (no loading indicator)
      }, REFRESH_INTERVAL);
    }
    
    return () => {
      // Clear timer on unmount
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [connected, useMockData]);

  // Handle cleanup for reconnection timers
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  // Load mock data function
  const loadMockData = useCallback(() => {
    console.log('Using mock auction data for development');
    setItems(MOCK_AUCTIONS);
    setIsLoading(false);
    setIsRefreshing(false);
    setUseMockData(true);
  }, []);

  // Function to handle WebSocket connections and event listeners
  const setupWebSocketConnection = useCallback(async () => {
    try {
      // Determine WebSocket URL
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const SERVER_HOST = process.env.NEXT_PUBLIC_SERVER_HOST || '127.0.0.1';
      const SERVER_PORT = process.env.NEXT_PUBLIC_SERVER_PORT || '4000';
      const wsUrl = `${protocol}//${SERVER_HOST}:${SERVER_PORT}`;
      
      console.log(`Connecting to WebSocket server at: ${wsUrl} (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      // Connect using the service
      await websocketService.connect(wsUrl);
      setConnected(true);
      setError("");
      
      // Clear any existing event handlers to prevent duplicates
      websocketService.on('message', () => {}); // No-op to clear
      websocketService.on('server', () => {});
      websocketService.on('error', () => {});
      websocketService.on('close', () => {});
      
      // Set up event handlers
      websocketService.on('server', (data) => {
        try {
          console.log('Server message received:', data);
          
          // Check for login success or failure
          if (data.response && typeof data.response === 'string') {
            if (data.response.includes('Login successful')) {
              console.log('Login successful');
              
              // Check if logged in with the browse account
              if (data.response.includes('browse')) {
                console.log('Logged in with browse account - view auction functionality limited');
                setUsingBrowseAccount(true);
              } else {
                setUsingBrowseAccount(false);
              }
              
              // Once logged in, request auction data
              websocketService.sendCommand('GET_AUCTIONS');
            } else if (data.response.includes('Invalid token') || data.response.includes('Login failed')) {
              console.log('Token or credentials invalid, trying browse account');
              // If token login fails, fall back to browse user
              websocketService.sendCommand('LOGIN browse browse');
              setUsingBrowseAccount(true);
            }
          }
          
          // Process the server response
          let serverData = data.message || data.response;
          
          // If it's a string, try to parse it as JSON
          if (typeof serverData === 'string') {
            try {
              serverData = JSON.parse(serverData);
            } catch (error) {
              console.log('Message is not JSON format:', serverData);
            }
          }
          
          // Check if this is auction data
          if (serverData && serverData.action === 'AUCTIONS_LIST' && Array.isArray(serverData.auctions)) {
            console.log('Received auction data:', serverData.auctions);
            
            // Transform the data to match our frontend format
            const auctionItems = serverData.auctions.map((auction) => {
              return {
                id: Number(auction.id),
                title: auction.title,
                currentBid: Number(auction.current_bid),
                endTime: new Date(auction.end_time),
                bids: Number(auction.bid_count || 0),
                category: auction.category || 'Uncategorized',
                condition: auction.condition || 'Unknown',
                imageUrl: auction.image_url || DEFAULT_IMAGE,
                description: auction.description || 'No description available',
                seller: auction.seller_username || 'Unknown seller'
              };
            });
            
            console.log('Transformed auction items:', auctionItems);
            setItems(auctionItems);
            setIsLoading(false);
            setIsRefreshing(false);
          }
        } catch (error) {
          console.error('Error processing message:', error);
          setError('Failed to process data from server');
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });
      
      websocketService.on('error', (error) => {
        console.error('WebSocket error:', error);
        setError('Cannot connect to auction server. Server might be down or unreachable.');
        setConnected(false);
        setIsLoading(false);
        setIsRefreshing(false);
        
        // Attempt to retry
        if (retryCount < MAX_RETRIES - 1) {
          console.log(`Connection error. Retrying in ${RETRY_DELAY/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
          reconnectTimerRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, RETRY_DELAY);
        } else {
          console.log('Max retries reached. Falling back to mock data.');
          loadMockData();
        }
      });
      
      websocketService.on('close', (event) => {
        console.log(`WebSocket connection closed with code: ${event.code}, reason: ${event.reason}`);
        setConnected(false);
        
        if (!event.wasClean) {
          setError('Connection to server was lost');
          setIsRefreshing(false);
          
          // Only retry if we haven't reached max retries
          if (retryCount < MAX_RETRIES - 1) {
            console.log(`Connection closed. Retrying in ${RETRY_DELAY/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
            reconnectTimerRef.current = setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, RETRY_DELAY);
          } else {
            console.log('Max retries reached. Falling back to mock data.');
            loadMockData();
          }
        }
      });
      
      // Check if user is logged in with a token first
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        console.log('Found stored token, attempting token login');
        // Try to login with stored token
        websocketService.sendCommand(`LOGIN_TOKEN ${storedToken}`);
      } else if (storedUser) {
        // If we have a user but no token, something is wrong with the login state
        console.log('No token found but user exists, falling back to browse account');
        websocketService.sendCommand('LOGIN browse browse');
        setUsingBrowseAccount(true);
      } else {
        // Default login if no stored credentials
        console.log('No stored credentials, using browse account');
        websocketService.sendCommand('LOGIN browse browse');
        setUsingBrowseAccount(true);
      }
      
      // Note: We don't need to send GET_AUCTIONS here because we'll do that after successful login
      
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setError('Could not establish connection to server');
      setIsLoading(false);
      setIsRefreshing(false);
      
      // Retry or use mock data
      if (retryCount < MAX_RETRIES - 1) {
        reconnectTimerRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, RETRY_DELAY);
      } else {
        loadMockData();
      }
    }
  }, [retryCount, loadMockData]);

  // WebSocket connection setup
  useEffect(() => {
    // If we've already decided to use mock data, don't try to connect
    if (useMockData) {
      return;
    }
    
    // Don't retry too many times
    if (retryCount >= MAX_RETRIES) {
      setError(`Could not connect to auction server after ${MAX_RETRIES} attempts. Using mock data instead.`);
      loadMockData();
      return;
    }
    
    setupWebSocketConnection();
    
  }, [retryCount, useMockData, setupWebSocketConnection, loadMockData]);

  // Function to refresh auctions
  const refreshAuctions = useCallback((showLoading = true) => {
    if (useMockData) {
      // If using mock data, just set isLoading to simulate refresh
      if (showLoading) setIsLoading(true);
      setIsRefreshing(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      }, 500);
      return;
    }
    
    if (websocketService.isConnected()) {
      if (showLoading) setIsLoading(true);
      setIsRefreshing(true);
      setError("");
      websocketService.sendCommand('GET_AUCTIONS');
    } else {
      // If not connected, try to reconnect
      setRetryCount(0); // Reset retry count to start fresh
    }
  }, [useMockData]);

  // Function to retry connection
  const retryConnection = useCallback(() => {
    setError("");
    setUseMockData(false);
    setRetryCount(0);
    setIsLoading(true);
  }, []);

  // Function to handle token refresh
  const refreshToken = useCallback(() => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken && websocketService.isConnected()) {
      console.log('Refreshing token authentication');
      websocketService.sendCommand(`LOGIN_TOKEN ${storedToken}`);
    } else {
      // If no token is available, try the browse account
      console.log('No token available, using browse account');
      websocketService.sendCommand('LOGIN browse browse');
      setUsingBrowseAccount(true);
    }
  }, []);

  // Format time remaining for auction
  const formatTimeRemaining = useCallback((endTime: Date) => {
    const diff = endTime.getTime() - now.getTime();
    if (diff <= 0) return "Ended";
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (d > 0) return `${d}d ${h}h left`;
    if (h > 0) return `${h}h ${m}m left`;
    return `${m}m left`;
  }, [now]);

  // Check if auction has ended
  const isAuctionEnded = useCallback((endTime: Date) => {
    return endTime.getTime() <= now.getTime();
  }, [now]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Could add additional search functionality here
  };

  // Handle price range changes
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({ ...prev, [name]: value }));
  };

  // Handle filter clearing
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedCondition("all");
    setPriceRange({ min: "", max: "" });
    setSortBy("ending-soon");
  };

  // Handle quick view
  const handleQuickView = (item: AuctionItem) => {
    setQuickViewItem(item);
    setModalOpen(true);
  };

  // Handle image load error
  const handleImageError = (itemId: number) => {
    setImageLoadErrors(prev => ({ ...prev, [itemId]: true }));
  };

  // Debounced filter logic
  useEffect(() => {
    const timeout = setTimeout(() => {
      let result = [...items];

      if (searchQuery) {
        result = result.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      if (selectedCategory !== "all") {
        result = result.filter(item => item.category.toLowerCase() === selectedCategory);
      }
      if (selectedCondition !== "all") {
        result = result.filter(item => item.condition.toLowerCase() === selectedCondition);
      }
      if (priceRange.min) {
        result = result.filter(item => item.currentBid >= Number(priceRange.min));
      }
      if (priceRange.max) {
        result = result.filter(item => item.currentBid <= Number(priceRange.max));
      }

      switch (sortBy) {
        case "ending-soon": result.sort((a, b) => a.endTime.getTime() - b.endTime.getTime()); break;
        case "price-low": result.sort((a, b) => a.currentBid - b.currentBid); break;
        case "price-high": result.sort((a, b) => b.currentBid - a.currentBid); break;
        case "most-bids": result.sort((a, b) => b.bids - a.bids); break;
      }

      setFilteredItems(result);
    }, 300);

    return () => clearTimeout(timeout);
  }, [items, searchQuery, selectedCategory, selectedCondition, priceRange, sortBy]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
        <div role="status" aria-busy="true" className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-r-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-600">Loading auctions...</p>
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
        <div className="max-w-md p-6 bg-white rounded-lg shadow text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
            Refresh Page
          </button>
          <button onClick={retryConnection} className="ml-2 border border-green-500 text-green-500 px-4 py-2 rounded-md hover:bg-green-50">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return ( 
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar />
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

            <button
              onClick={() => refreshAuctions(true)}
              disabled={isRefreshing}
              title="Refresh auctions"
              className={`hidden sm:flex items-center justify-center p-2 border border-gray-300 rounded-lg bg-white text-gray-700 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
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

        {useMockData && (
          <div className="mb-4 bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg border border-yellow-200">
            <p className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Using mock data for development. Live auction data unavailable.
              <button 
                onClick={retryConnection}
                className="ml-auto bg-yellow-100 px-3 py-1 rounded hover:bg-yellow-200 text-sm"
              >
                Try Live Data
              </button>
            </p>
          </div>
        )}

        {!connected && !useMockData && (
          <div className="mb-4 bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg border border-yellow-200">
            <p className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Not connected to server. Some features may be unavailable.
              <button 
                onClick={() => retryConnection()}
                className="ml-auto bg-yellow-100 px-3 py-1 rounded hover:bg-yellow-200 text-sm"
              >
                Retry
              </button>
            </p>
          </div>
        )}

        {usingBrowseAccount && (
          <div className="mb-4 bg-blue-50 text-blue-800 px-4 py-3 rounded-lg border border-blue-200">
            <p className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              You are browsing as a guest. Log in to view auction details and place bids.
              <button 
                onClick={() => router.push('/auth/login')}
                className="ml-auto bg-blue-100 px-3 py-1 rounded hover:bg-blue-200 text-sm"
              >
                Log In
              </button>
            </p>
          </div>
        )}

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
                  <label htmlFor="min" className="block text-xs text-gray-500 mb-1">
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
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="max" className="block text-xs text-gray-500 mb-1">
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
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    {filteredItems.map((item) => {
                      const isAuctionEnded = item.endTime.getTime() <= now.getTime();
                      
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                        >
                          <Link href={`/auction/${item.id}`}>
                            <div className="relative h-48 bg-gray-100">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full bg-gray-200">
                                  <Camera className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-medium text-gray-900 mb-1 truncate">{item.title}</h3>
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <p className="text-sm text-gray-500">Current Bid</p>
                                  <p className="text-lg font-bold text-gray-900">${item.currentBid.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">{item.bids} bids</p>
                                  <p className="text-sm font-medium text-red-500">{formatTimeRemaining(item.endTime)}</p>
                                </div>
                              </div>
                            </div>
                          </Link>
                          <div className="px-4 pb-4">
                            <button                              
                              onClick={() => {
                                // Navigate to the auction page for the specific item
                                router.push(`/auction/${item.id}`);
                              }}
                              className={`w-full py-2 px-4 rounded-md transition-colors ${
                                isAuctionEnded 
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                              }`}
                              disabled={isAuctionEnded}
                            >
                              {isAuctionEnded ? 'Auction Ended' : 'View Auction'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredItems.map((item) => {
                      const isAuctionEnded = item.endTime.getTime() <= now.getTime();
                      
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                        >
                          <div className="flex flex-col sm:flex-row">
                            <Link href={`/auction/${item.id}`} className="relative h-32 w-full sm:w-48 bg-gray-100 flex-shrink-0">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full bg-gray-200">
                                  <Camera className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </Link>
                            <div className="p-4 flex-1 flex flex-col">
                              <Link href={`/auction/${item.id}`}>
                                <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                              </Link>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                  <div>
                                    <p className="text-sm text-gray-500">Current Bid</p>
                                    <p className="text-lg font-bold text-gray-900">${item.currentBid.toFixed(2)}</p>
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
                              <div className="mt-4">
                                <button 
                                  onClick={() => {
                                    // Navigate to the auction page for the specific item
                                    router.push(`/auction/${item.id}`);
                                  }}
                                  className={`w-full py-2 px-4 rounded-md transition-colors ${
                                    isAuctionEnded 
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                      : 'bg-green-500 hover:bg-green-600 text-white'
                                  }`}
                                  disabled={isAuctionEnded}
                                >
                                  {isAuctionEnded ? 'Auction Ended' : 'View Auction'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}