import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Variations – Made By Mobbs",
    short_name: "Variations",
    description: "Variations for Made By Mobbs",
    start_url: "/",
    display: "standalone",
    background_color: "#003923",
    theme_color: "#003923",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
