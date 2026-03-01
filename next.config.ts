import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Recommended for production
  poweredByHeader: false,
  compress: true,
  // Experimental: faster server components
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Allow building even with TS/lint errors for now
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

export default nextConfig
