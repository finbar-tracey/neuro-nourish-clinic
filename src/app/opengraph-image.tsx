import { ImageResponse } from "next/og";

export const alt = "NeuroNourish — Personalised Brain Health Programme";
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
          background: "linear-gradient(135deg, #1A3348 0%, #2C1F4A 100%)",
          color: "#F5F0E6",
        }}
      >
        <div style={{ fontSize: 28, color: "#C9A84C", letterSpacing: 4, textTransform: "uppercase" }}>
          NeuroNourish Clinic
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 52,
            marginTop: 24,
            lineHeight: 1.2,
            fontFamily: "serif",
          }}
        >
          <div>Support your memory.</div>
          <div>Strengthen your brain health.</div>
          <div>Live with confidence.</div>
        </div>
        <div style={{ fontSize: 28, marginTop: 32, color: "#B8D4E2", maxWidth: 900 }}>
          Personalised brain health programmes · Ireland &amp; UK
        </div>
      </div>
    ),
    { ...size },
  );
}
