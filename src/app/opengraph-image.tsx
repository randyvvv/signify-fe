import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_LOGO, SITE_TITLE } from "@/lib/site";

// Gambar preview default saat link Signify dibagikan (artikel berita memakai cover sendiri).
export const alt = SITE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public", SITE_LOGO));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 88px",
          background: "linear-gradient(135deg, #2DA5A2 0%, #0B7077 55%, #0F5A5A 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 360,
            height: 360,
            flexShrink: 0,
            borderRadius: 56,
            background: "white",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse hanya mendukung <img> */}
          <img src={logoSrc} width={340} height={305} alt="" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 600 }}>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.08 }}>
            Where Vision Meets Understanding
          </div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.35, color: "#D2E6E4" }}>
            AI-powered sign language learning with a 3D signing avatar and real-time practice.
          </div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              marginTop: 12,
              padding: "10px 24px",
              borderRadius: 16,
              background: "#FFE75C",
              color: "#5A4A00",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            ai-signify.com
          </div>
        </div>
      </div>
    ),
    size,
  );
}
