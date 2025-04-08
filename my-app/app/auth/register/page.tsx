"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import websocketService from '../../lib/websocket';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
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
      console.log('Response:', data);
      
      if (data.response && data.response.includes('Registration successful')) {
        // Redirect to login page on successful registration
        router.push('/auth/login');
      } else if (data.response && (data.response.includes('already exists') || data.response.includes('failed'))) {
        setError('Username already exists or registration failed');
      }
    });

    return () => {
      // Clean up event listeners if needed
    };
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Sending registration:', formData);
      websocketService.sendCommand(`REGISTER ${formData.username} ${formData.email} ${formData.password}`);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-black">Register</h1>
        <button
            onClick={() => router.push("/")}
            className="mb-4 text-sm text-green-600 hover:underline"
          >
            ← Back to Home
          </button>
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
              className="text-sm w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-black"
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="text-sm w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-black"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="text-sm w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-black"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div className="mt-5 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-green-500 hover:text-green-600">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}