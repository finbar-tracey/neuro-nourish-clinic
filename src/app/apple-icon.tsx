import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isNeuronourish } from "@/lib/vertical-config";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const iconPath = isNeuronourish()
    ? join(process.cwd(), "public/brand/neuronourish-brain.png")
    : join(process.cwd(), "public/favicon.svg");
  const icon = await readFile(iconPath);
  const mime = isNeuronourish() ? "image/png" : "image/svg+xml";
  const src = `data:${mime};base64,${icon.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isNeuronourish() ? "#F5F0E6" : "#1c1c55",
          borderRadius: 32,
        }}
      >
        <img src={src} width={150} height={150} alt="" />
      </div>
    ),
    { ...size },
  );
}
