/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Lets the browser call /api/backend/* same-origin; proxied to FastAPI.
    // Direct calls to NEXT_PUBLIC_API_URL also work (CORS is enabled server-side).
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
      // Same-origin FastAPI docs so the API tab can iframe Swagger.
      { source: "/docs", destination: `${backendUrl}/docs` },
      { source: "/docs/:path*", destination: `${backendUrl}/docs/:path*` },
      { source: "/redoc", destination: `${backendUrl}/redoc` },
      { source: "/openapi.json", destination: `${backendUrl}/openapi.json` },
    ];
  },
};

export default nextConfig;
