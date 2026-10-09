import Image from "next/image";
import { Crown } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";

const MAIN_SPONSOR = {
  name: "Indonesia AI Institute",
  logo: "/sponsors/indonesia-ai-institute.png",
  width: 900,
  height: 304,
};

const SPONSORS = [
  { name: "AI Center ITB", logo: "/sponsors/ai-center-itb.png", width: 520, height: 520 },
  { name: "Telkom Indonesia", logo: "/sponsors/telkom-indonesia.png", width: 760, height: 417 },
];

export function Sponsors() {
  return (
    <section id="sponsors" className="container mx-auto px-6 py-24 md:px-12">
      <Reveal className="text-center">
        <span className="inline-block rounded-lg bg-[#D4E1FF] px-4 py-1.5 text-md text-[#0B7077]">
          Our Sponsors
        </span>
        <h2 className="mt-4 font-heading text-4xl font-bold text-[#0F5A5A] md:text-5xl">Supported by</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
          Signify is made possible with support from these organizations.
        </p>
      </Reveal>

      <div className="mx-auto mt-14 flex max-w-5xl flex-col gap-6">
        <Reveal variant="zoom">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#D2E6E4] px-6 py-10 md:px-12 md:py-12">
            <div
              className="absolute inset-0 opacity-40 mix-blend-multiply"
              style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
            />
            <div className="relative flex flex-col items-center gap-6">
              <span className="inline-flex items-center gap-2 rounded-lg bg-[#FFE75C] px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-[#5A4A00]">
                <Crown className="h-4 w-4" aria-hidden />
                Main Sponsor
              </span>
              <div className="flex w-full max-w-xl items-center justify-center rounded-3xl bg-white px-8 py-8 shadow-[0_10px_30px_-18px_rgba(11,112,119,0.45)] md:px-14 md:py-10">
                <Image
                  src={MAIN_SPONSOR.logo}
                  alt={MAIN_SPONSOR.name}
                  width={MAIN_SPONSOR.width}
                  height={MAIN_SPONSOR.height}
                  sizes="(min-width: 768px) 420px, 80vw"
                  className="h-20 w-auto object-contain md:h-28"
                />
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2">
          {SPONSORS.map((sponsor, i) => (
            <Reveal key={sponsor.name} delay={120 + i * 120} className="h-full">
              <div className="flex h-full items-center justify-center rounded-[2rem] border border-[#0F5A5A]/10 bg-white px-8 py-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.08)]">
                <Image
                  src={sponsor.logo}
                  alt={sponsor.name}
                  width={sponsor.width}
                  height={sponsor.height}
                  sizes="(min-width: 640px) 240px, 60vw"
                  className="h-24 w-auto object-contain md:h-28"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
