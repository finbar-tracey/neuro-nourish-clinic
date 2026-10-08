import type { MetadataRoute } from "next";
import { isHealthcare } from "@/lib/vertical-config";

export default function manifest(): MetadataRoute.Manifest {
  if (isHealthcare()) {
    return {
      name: "Booked Consult",
      short_name: "Booked Consult",
      description: "Qualified implant consultations for private clinics",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#1c1c55",
      icons: [
        {
          src: "/favicon.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any",
        },
      ],
    };
  }

  return {
    name: "NeuroNourish Clinic",
    short_name: "NeuroNourish",
    description: "Personalised brain health programmes for adults in Ireland & the UK",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F0E6",
    theme_color: "#1B3A5C",
    lang: "en-GB",
    icons: [
      {
        src: "/brand/neuronourish-brain.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
