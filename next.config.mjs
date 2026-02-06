/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/player-media-admin',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
