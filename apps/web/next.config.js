/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  outputFileTracingRoot: require('path').join(__dirname, '../..'),
  poweredByHeader: false,
  async rewrites() {
    const api = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000';
    const analytics = process.env.ANALYTICS_INTERNAL_URL || 'http://127.0.0.1:8000';
    return [
      { source: '/api/:path*', destination: `${api}/api/:path*` },
      { source: '/health/api', destination: `${api}/ready` },
      { source: '/analytics/:path*', destination: `${analytics}/:path*` },
      { source: '/openapi.json', destination: `${analytics}/openapi.json` },
    ];
  },
};
