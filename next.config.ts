import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

/**
 * script-src держит 'unsafe-inline' осознанно: Next.js инлайнит bootstrap-скрипт
 * гидратации, а nonce-политика требует middleware на каждом запросе и переводит
 * маркетинг из SSG в динамический рендер. Компромисс в пользу статики лендинга;
 * при появлении реального бэкенда политика ужесточается до nonce на (dashboard).
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@tanstack/react-query"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default bundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig);
