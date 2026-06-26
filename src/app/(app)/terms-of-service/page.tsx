import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Signify",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating an account or using Signify, you agree to these Terms of Service. If you do not agree, please discontinue use of the platform.",
  },
  {
    title: "2. Using Signify",
    body: "Signify is provided as a learning platform for sign language and inclusive education. You agree to use it lawfully and not to misuse, disrupt, or attempt to gain unauthorized access to the service or other users' accounts.",
  },
  {
    title: "3. Accounts",
    body: "You are responsible for the accuracy of your account information and for keeping your credentials secure. You are responsible for all activity that occurs under your account.",
  },
  {
    title: "4. Camera & Content",
    body: "Some features use your device camera for on-device hand and pose detection. You are responsible for your surroundings while using these features. Learning content is provided for educational purposes and may be updated or changed over time.",
  },
  {
    title: "5. Virtual Items & Coins",
    body: "Coins, avatars, and customization items are virtual goods with no monetary value, are non-transferable, and cannot be exchanged for cash. They may be modified or removed as the platform evolves.",
  },
  {
    title: "6. Intellectual Property",
    body: "Signify and its content, branding, and software are owned by the Signify team. You may not copy, redistribute, or create derivative works without permission.",
  },
  {
    title: "7. Disclaimer",
    body: "Signify is provided on an “as is” basis for educational use. Translations and feedback are generated automatically and may not always be accurate; they should not be relied upon as a substitute for professional interpretation where accuracy is critical.",
  },
  {
    title: "8. Changes to These Terms",
    body: "We may update these Terms from time to time. Continued use of Signify after changes take effect constitutes acceptance of the revised Terms.",
  },
];

export default function TermsOfServicePage() {
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
          <h1 className="text-xl font-bold text-black">Terms of Service</h1>
          <p className="text-sm text-grey">The rules for using Signify</p>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="mb-6 text-sm text-grey">
          Last updated: June 2026. Please read these terms carefully before
          using Signify.
        </p>
        <div className="flex flex-col gap-6">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="mb-1 font-bold text-black">{s.title}</h2>
              <p className="text-sm leading-relaxed text-grey">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
