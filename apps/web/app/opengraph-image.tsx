import { ImageResponse } from "next/og";
import { getDictionary } from "@stayboost/i18n";

export const alt = "StayBoost — AI-Powered Hospitality Growth Operating System";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage(): ImageResponse {
  const t = getDictionary().common;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0ea5e9 0%, #0b1120 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, opacity: 0.9 }}>{t.brand}</div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
          Turn every empty night into revenue.
        </div>
        <div style={{ fontSize: 30, marginTop: 28, opacity: 0.85 }}>{t.tagline}</div>
      </div>
    ),
    size,
  );
}
