import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "About Signify",
};

const team = [
  "Randy Verdian",
  "Muhammad Al Thariq Fairuz",
  "Shafiq Irvansyah",
  "Sa'ad Abdul Hakim",
  "Yusuf Ardian Sandi",
  "Thea Josephine Halim",
  "Melati Anggraini",
  "Olivia Christy Lismanto",
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
        <Link
          href="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="h-6 w-6 text-black" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-black">About Signify</h1>
          <p className="text-sm text-grey">Learn more about the app & team</p>
        </div>
      </div>

      {/* About app */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-black">Signify</h2>
        <p className="mb-3 text-sm font-medium text-quinary">
          Where Vision Meets Understanding
        </p>
        <p className="text-sm leading-relaxed text-grey">
          Signify is an integrated, inclusive learning platform built for Deaf
          and hard-of-hearing learners. Instead of fragmented tools that each
          solve only one part of the problem, it brings accessibility and
          education together in a single connected ecosystem.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-grey">
          Powered by agentic AI, Signify acts as a proactive, adaptive learning
          companion — understanding each learner&apos;s goals, tracking progress,
          and recommending the right materials and practice. It translates
          speech and live video into sign language through a 3D avatar (and signs
          back into text), provides interactive sign practice with real-time
          camera feedback, gamified progress, and quizzes for technical and
          professional vocabulary — supporting learners from K–12 and vocational
          training to university and the workforce.
        </p>
        <p className="mt-4 text-sm font-medium text-grey">Version 1.0.0</p>
      </div>

      {/* Team */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-black">Our Team</h2>
        <ol className="flex flex-col gap-2">
          {team.map((name, i) => (
            <li
              key={name}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-quaternary">
                {i + 1}
              </span>
              <span className="font-medium text-black">{name}</span>
            </li>
          ))}
        </ol>

        {/* Institution */}
        <div className="mt-6 flex flex-col items-center gap-3 border-t border-gray-100 pt-6 text-center">
          <Image
            src="/logo/itb.png"
            alt="Institut Teknologi Bandung"
            width={160}
            height={160}
            className="h-24 w-auto object-contain"
          />
          <p className="text-sm font-semibold text-black">
            Bandung Institute of Technology
          </p>
        </div>
      </div>
    </div>
  );
}
