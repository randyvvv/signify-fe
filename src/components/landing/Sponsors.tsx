import Image from "next/image";
import { Reveal } from "@/components/landing/Reveal";

type Sponsor = {
  name: string;
  logo: string;
  url: string;
  width: number;
  height: number;
};

const MAIN_SPONSOR: Sponsor = {
  name: "Indonesia AI Institute",
  logo: "/sponsors/indonesia-ai-institute.png",
  url: "https://aiinstitute.id/id/",
  width: 900,
  height: 304,
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
    name: "Telkom Indonesia",
    logo: "/sponsors/telkom-indonesia.png",
    url: "https://www.telkom.co.id/",
    width: 760,
    height: 417,
  },
];

function SponsorLink({ sponsor, sizes, className }: { sponsor: Sponsor; sizes: string; className: string }) {
  return (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex rounded-xl p-2 transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7077] focus-visible:ring-offset-4"
    >
      <Image
        src={sponsor.logo}
        alt={`${sponsor.name} (opens in a new tab)`}
        width={sponsor.width}
        height={sponsor.height}
        sizes={sizes}
        className={`w-auto object-contain ${className}`}
      />
    </a>
  );
}

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

      <div className="mx-auto mt-14 flex max-w-4xl flex-col items-center gap-10 md:gap-14">
        <Reveal variant="zoom">
          <SponsorLink
            sponsor={MAIN_SPONSOR}
            sizes="(min-width: 768px) 520px, 80vw"
            className="h-24 md:h-36"
          />
        </Reveal>

        <div className="flex w-full flex-wrap items-center justify-center gap-x-16 gap-y-8 md:gap-x-28">
          {SPONSORS.map((sponsor, i) => (
            <Reveal key={sponsor.name} delay={120 + i * 120}>
              <SponsorLink sponsor={sponsor} sizes="(min-width: 768px) 200px, 40vw" className="h-16 md:h-24" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
