import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

// Ambil transcript/caption YouTube di server (hindari CORS dari browser).
// Body: { url: string, lang?: string }
// Respons: { cues: { text, offset, duration }[] }  (satuan offset/duration
// bisa ms atau detik tergantung format caption — dinormalisasi di klien
// memakai durasi video dari player.)

interface Body {
  url?: string;
  lang?: string;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const { url, lang } = body ?? {};
  if (!url || !url.trim()) {
    return NextResponse.json({ error: "URL kosong" }, { status: 400 });
  }

  try {
    const items = await YoutubeTranscript.fetchTranscript(
      url.trim(),
      lang ? { lang } : undefined,
    );
    const cues = items.map((it) => ({
      text: it.text,
      offset: it.offset,
      duration: it.duration,
    }));
    if (cues.length === 0) {
      return NextResponse.json(
        { error: "Video ini tidak punya transcript/caption." },
        { status: 404 },
      );
    }
    return NextResponse.json({ cues });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error:
          "Gagal mengambil transcript. Pastikan video punya caption & bukan video privat/terbatas.",
        detail: msg,
      },
      { status: 502 },
    );
  }
}
