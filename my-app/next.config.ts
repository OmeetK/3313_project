import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: ['i.imgur.com'], // ✅ Allow Imgur
  },
}

export default nextConfig
