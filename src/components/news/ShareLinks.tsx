"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";

const TARGETS = [
  { label: "WhatsApp", url: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}` },
  { label: "LinkedIn", url: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  {
    label: "X",
    url: (u: string, t: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  },
];

const pill =
  "inline-flex items-center gap-2 rounded-full border border-[#0F5A5A]/15 bg-white px-4 py-2 text-sm font-semibold text-[#0B7077] transition-colors hover:border-[#0B7077] hover:bg-[#F1F8F7]";

export function ShareLinks({ title }: { title: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copy} className={pill}>
        <Link2 className="h-4 w-4" aria-hidden />
        Copy link
      </button>
      {TARGETS.map((target) => (
        <button
          key={target.label}
          type="button"
          onClick={() =>
            window.open(target.url(window.location.href, title), "_blank", "noopener,noreferrer")
          }
          className={pill}
        >
          {target.label}
        </button>
      ))}
    </div>
  );
}
