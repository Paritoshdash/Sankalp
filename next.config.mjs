import withPWA from 'next-pwa'


/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
}

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

export default pwaConfig(nextConfig)
   