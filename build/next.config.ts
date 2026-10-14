import type { NextConfig } from "next";

const config: NextConfig = {
  outputFileTracingIncludes: { "/api/auth/*": ["./data/users.sqlite"], "/account": ["./data/users.sqlite"] },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
    ] }];
  },
};
export default config;
