/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/media-player',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
