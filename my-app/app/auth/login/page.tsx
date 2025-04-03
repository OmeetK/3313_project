"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import websocketService from '../../lib/websocket';

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
    if (!websocketService.isConnected()) {
      websocketService.connect()
        .catch(err => {
          console.error(err);
          setError('Failed to connect to server');
        });
    }

    // Listen for server responses
    websocketService.on('message', (data) => {
      setIsLoading(false);
      console.log('EXACT DATA TYPE:', typeof data);
      console.log('EXACT DATA VALUE:', data);

      // If data is a string, not an object with a response property
      const response = typeof data === 'string' ? data : data.response;
      
      if (data.response && data.response.includes('Login successful')) {
        // Extract token
        const tokenPart = data.response.split('TOKEN:')[1];
        console.log('Token part:', tokenPart);
        
        if (tokenPart) {
          const token = tokenPart.trim();
          console.log('Storing token in localStorage');
          localStorage.setItem('token', token);
          localStorage.setItem('user', formData.username);
          console.log('Redirecting to /browse');
          router.push('/browse');
        } else {
          console.error('Token not found in response');
        }
      } else {
        console.log('Login unsuccessful or response format unexpected');
      }
    });

    return () => {
      // Clean up event listeners if needed
    };
  }, [router, formData.username]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Login submitted:', formData);
      
      // Send login command to WebSocket server
      websocketService.sendCommand(`LOGIN ${formData.username} ${formData.password}`);
      
      // Response will be handled by the useEffect listener
    } catch (err) {
      setError('Connection error. Please try again.');
      setIsLoading(false);
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-5 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-green-500 hover:text-green-600">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}