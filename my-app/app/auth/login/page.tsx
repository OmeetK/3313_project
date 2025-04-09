"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import websocketService from '../../lib/websocket';
import Navbar from "../../Navbar"


export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Connect to WebSocket when component mounts
    const connectWebSocket = async () => {
      try {
        // Ensure connection is established
        await websocketService.connect();
        
        // Set up message listener
        const handleMessage = (data: any) => {
          console.log('FULL Received login response:', JSON.stringify(data, null, 2));
          
          // Reset loading state
          setIsLoading(false);

          // Comprehensive login success check
          const isLoginSuccessful = 
            (data.status === 'success') ||
            (data.type === 'server' && 
             (data.response === 'Login successful' || 
              (typeof data.response === 'string' && data.response.includes('Login successful')) ||
              (typeof data.message === 'string' && data.message.includes('Login successful')))) ||
            (typeof data.response === 'string' && data.response.includes('Login successful'));

          if (isLoginSuccessful) {
            // Extract token with multiple fallback methods
            const token = 
              data.token || 
              (typeof data.message === 'string' && data.message.match(/TOKEN:(\S+)/)?.[1]) ||
              (typeof data.response === 'string' && data.response.match(/TOKEN:(\S+)/)?.[1]);
            
            console.log('Extracted token details:', {
              hasToken: !!token,
              tokenLength: token ? token.length : 'N/A',
              dataKeys: Object.keys(data)
            });

            if (token) {
              console.log('Login successful, storing token');
              
              // Store user credentials
              localStorage.setItem('token', token);
              localStorage.setItem('user', formData.username);
              
              // Redirect to browse page
              router.push('/browse');
            } else {
              console.error('Token extraction failed', {
                data,
                message: data.message,
                response: data.response
              });
              setError('Login failed: No token received');
            }
          } else {
            // Handle login failure with detailed logging
            console.log('Login unsuccessful', data);
            setError('Login failed. Please check your credentials.');
          }
        };

        // Set up error handling
        const handleError = (errorData: any) => {
          console.error('WebSocket error:', errorData);
          setError(errorData.message || 'Connection error occurred');
          setIsLoading(false);
        };

        // Attach listeners
        websocketService.on('message', handleMessage);
        websocketService.on('error', handleError);
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        setError('Failed to connect to server');
      }
    };

    // Initial connection
    connectWebSocket();

    // Cleanup function
    return () => {
      // Remove listeners if needed
    };
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous errors
    setError('');
    setIsLoading(true);
    
    try {
      // Validate input
      if (!formData.username || !formData.password) {
        setError('Please enter both username and password');
        setIsLoading(false);
        return;
      }
      
      // Ensure connection before sending command
      await websocketService.connect();
      
      // Send login command via WebSocket
      websocketService.sendCommand(`LOGIN ${formData.username} ${formData.password}`);
    } catch (err) {
      console.error('Login submission error:', err);
      setError('Connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-8">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>
            
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
              }`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-5 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="text-green-500 hover:text-green-600 font-semibold"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}