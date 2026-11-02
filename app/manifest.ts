import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BibleWithYou",
    short_name: "BibleWithYou",
    description: "Find a Bible story and verses for what you're going through.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F5F7",
    theme_color: "#1F5F5B",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
