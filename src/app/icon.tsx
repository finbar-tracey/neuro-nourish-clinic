import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isNeuronourish } from "@/lib/vertical-config";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
          background: isNeuronourish() ? "transparent" : "#1c1c55",
        }}
      >
        <img src={src} width={28} height={28} alt="" />
      </div>
    ),
    { ...size },
  );
}
