import { ImageResponse } from "next/og";

export const alt = "NeuroNourish — Protect Your Memory. Optimise Brain Performance.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #1B3A5C 0%, #3D6480 100%)",
          color: "#F5F0E6",
        }}
      >
        <div style={{ fontSize: 28, color: "#C9A84C", letterSpacing: 4, textTransform: "uppercase" }}>
          NeuroNourish
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 48,
            marginTop: 24,
            lineHeight: 1.2,
            fontFamily: "serif",
          }}
        >
          <div>Protect Your Memory.</div>
          <div>Optimise Brain Performance.</div>
          <div>Strengthen Your Future.</div>
        </div>
        <div style={{ fontSize: 26, marginTop: 32, color: "#B8D4E2", maxWidth: 920 }}>
          Personalised lifestyle medicine, biomarkers and nutrition for lasting brain health
        </div>
      </div>
    ),
    { ...size },
  );
}
