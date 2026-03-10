/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack alias (Next.js 16+ default bundler)
  turbopack: {
    resolveAlias: {
      '@mediapipe/selfie_segmentation': './lib/mediapipe-stub.js',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    '@tensorflow/tfjs-core',
    '@tensorflow/tfjs-backend-webgl',
    '@tensorflow-models/body-segmentation',
  ],
}

export default nextConfig
