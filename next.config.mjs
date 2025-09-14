/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' since we have API routes
  trailingSlash: true,
  images: {
    unoptimized: true
  }
  // Remove the rewrites since we're using API routes now
};

export default nextConfig;
