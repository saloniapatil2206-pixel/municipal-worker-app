/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // GitHub Pages handles repositories with 'repo-name' as a subpath
  basePath: '/municipal-worker-app',
  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
