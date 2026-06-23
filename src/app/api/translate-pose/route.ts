import { NextResponse } from "next/server";

// Proxy ke SignGPT (text -> .pose) supaya tidak kena CORS dari browser.
const SIGNGPT_URL = "https://www.signgpt.org/api/translate-pose";

interface TranslatePoseBody {
  text?: string;
  signedLanguage?: string;
  spokenLanguage?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranslatePoseBody;
    const { text, signedLanguage = "ase", spokenLanguage = "en" } = body ?? {};

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Teks tidak boleh kosong" },
        { status: 400 },
      );
    }

    const upstream = await fetch(SIGNGPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signedLanguage, spokenLanguage, text }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return NextResponse.json(
        { error: `SignGPT error (${upstream.status})`, detail },
        { status: 502 },
      );
    }

    // Respons SignGPT: { pose: <base64>, contentType: string }
    const data = (await upstream.json()) as { pose?: string; contentType?: string };
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal memanggil SignGPT", detail: String(err) },
      { status: 500 },
    );
  }
}
