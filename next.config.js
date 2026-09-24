// ForgeOps — production build config
// `next build` with output: 'standalone' produces a self-contained server
// that the Dockerfile copies into a slim runner image.
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
}

module.exports = nextConfig
