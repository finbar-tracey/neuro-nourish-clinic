import type { NextConfig } from "next";

const isNeuronourish =
  process.env.VERTICAL === "neuronourish" || process.env.NEXT_PUBLIC_VERTICAL === "neuronourish";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  outputFileTracingIncludes: {
    "/api/health/neuronourish": ["./.neuronourish-brand-report.json"],
  },
  async headers() {
    const staticCache = [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];

    if (isNeuronourish) {
      return [
        {
          source: "/:path*",
          headers: securityHeaders,
        },
        {
          source: "/workspace/:path*",
          headers: [
            ...securityHeaders,
            { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          ],
        },
        {
          source: "/api/:path*",
          headers: [
            ...securityHeaders,
            { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          ],
        },
        ...staticCache,
      ];
    }

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          ...securityHeaders,
        ],
      },
      ...staticCache,
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async redirects() {
    if (!isNeuronourish) return [];
    return [
      {
        source: "/assessment",
        destination: "/shop/cognitive-assessment",
        permanent: false,
      },
      {
        source: "/assessment/success",
        destination: "/shop/success?product=cognitive-assessment",
        permanent: false,
      },
      {
        source: "/programme/success",
        destination: "/shop/success?product=medium-programme",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
