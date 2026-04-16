/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Railway injects PORT — Next.js must bind to it
  serverRuntimeConfig: {
    port: process.env.PORT || 3000,
  },
}

export default nextConfig
