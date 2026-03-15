import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: ({ url }) => {
          const isSupabase = url.pathname.includes('/rest/') || 
                            url.pathname.includes('/auth/') || 
                            url.pathname.includes('/storage/');
          const isApi = url.pathname.startsWith('/api/');
          return isSupabase || isApi;
        },
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
        },
      },
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/') && !url.pathname.startsWith('/api/') && !url.pathname.includes('/_next/'),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'ui-shell',
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
};

export default withPWA(nextConfig);
