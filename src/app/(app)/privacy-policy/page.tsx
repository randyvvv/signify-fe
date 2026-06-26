import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Signify",
};

const sections = [
  {
    title: "1. Information We Collect",
    body: "We collect the information you provide when you create an account (such as your name and email) and data generated while you use Signify — including practice sessions, quiz results, and avatar customizations. To power real-time sign-language features, your camera may be used on-device; video frames are processed in your browser and are not uploaded or stored by us.",
  },
  {
    title: "2. How We Use Your Information",
    body: "Your information is used to operate and improve Signify: tracking your learning progress, personalizing your avatar, saving preferences, and providing translation and practice feedback. We do not sell your personal data.",
  },
  {
    title: "3. Camera & Media",
    body: "The Sign Practice and Live Translator features access your camera only while you are actively using them. Hand and pose detection runs locally in your browser. You can revoke camera permission at any time through your browser settings.",
  },
  {
    title: "4. Data Storage & Security",
    body: "Account data and progress are stored securely on our servers. We apply reasonable technical and organizational measures to protect your information against unauthorized access, loss, or misuse.",
  },
  {
    title: "5. Your Rights",
    body: "You may access, update, or delete your account information at any time from the Settings and Profile pages. If you delete your account, your associated data is removed from our active systems.",
  },
  {
    title: "6. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. Significant changes will be communicated within the app. Continued use of Signify after an update constitutes acceptance of the revised policy.",
  },
  {
    title: "7. Contact",
    body: "For questions about this Privacy Policy or your data, please reach out to the Signify team listed on the About page.",
  },
];

export default function PrivacyPolicyPage() {
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
          <h1 className="text-xl font-bold text-black">Privacy Policy</h1>
          <p className="text-sm text-grey">How Signify handles your data</p>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="mb-6 text-sm text-grey">
          Last updated: June 2026. This policy explains what information Signify
          collects, how it is used, and the choices you have.
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
