/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' since we have API routes
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // got-scraping reads its header-fingerprint data files from disk at
  // runtime, so it must stay external — bundling it breaks those paths.
  serverExternalPackages: ['got-scraping']
};

export default nextConfig;
