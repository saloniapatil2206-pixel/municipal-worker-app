const isProd = process.env.NODE_ENV === 'production'
const repoName = 'municipal-worker-app'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isProd ? 'export' : undefined,
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
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
