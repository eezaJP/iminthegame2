import type { MetadataRoute } from "next";

// PWA manifest — used when the site is added to the home screen (Android reads
// name/icons from here; iOS reads apple-icon + appleWebApp.title from layout).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "I'm in the game · ЧМ-2026",
    short_name: "I'm in the game",
    description:
      "Дружеская лига прогнозов на Чемпионат мира по футболу 2026: рейтинг, группы, плей-офф.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a140e",
    theme_color: "#0e9f6e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
