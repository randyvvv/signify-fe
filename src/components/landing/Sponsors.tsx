import Image from "next/image";
import { Reveal } from "@/components/landing/Reveal";

type Sponsor = {
  name: string;
  logo: string;
  url: string;
  width: number;
  height: number;
};

const SPONSORS: Sponsor[] = [
  {
    name: "AI Center ITB",
    logo: "/sponsors/ai-center-itb.png",
    url: "https://itb.ac.id/pusat-artificial-intelligence/",
    width: 520,
    height: 520,
  },
  {
    name: "Indonesia AI Institute",
    logo: "/sponsors/indonesia-ai-institute.png",
    url: "https://aiinstitute.id/id/",
    width: 900,
    height: 304,
  },
  {
    name: "Telkom Indonesia",
    logo: "/sponsors/telkom-indonesia.png",
    url: "https://www.telkom.co.id/",
    width: 760,
    height: 417,
  },
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

      {/* Tiga sponsor setara: tiap logo mendapat kotak yang sama besar. */}
      <div className="mx-auto mt-14 grid max-w-5xl grid-cols-3 items-center gap-4 sm:gap-10 md:gap-16">
        {SPONSORS.map((sponsor, i) => (
          <Reveal key={sponsor.name} delay={i * 120}>
            <a
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-20 items-center justify-center rounded-xl p-2 transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7077] focus-visible:ring-offset-4 sm:h-24 md:h-32"
            >
              <Image
                src={sponsor.logo}
                alt={`${sponsor.name} (opens in a new tab)`}
                width={sponsor.width}
                height={sponsor.height}
                sizes="(min-width: 768px) 280px, 30vw"
                className="h-full w-full object-contain"
              />
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
