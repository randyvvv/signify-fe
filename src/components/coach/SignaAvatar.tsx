import Image from "next/image";
import { cn } from "@/lib/utils";

const SIGNA_SRC = "/signa.png";

/**
 * Avatar Signa, AI agent Signify Coach.
 * - "face": crop lingkaran di wajah (untuk chat, header, sidebar).
 * - "full": ilustrasi utuh (melambai + balon "SIGNA") untuk sapaan.
 */
export function SignaAvatar({
  variant = "face",
  className,
  priority,
}: {
  variant?: "face" | "full";
  className?: string;
  priority?: boolean;
}) {
  if (variant === "full") {
    return (
      <Image
        src={SIGNA_SRC}
        alt="Signa, your Signify Coach"
        width={1254}
        height={1254}
        sizes="240px"
        priority={priority}
        className={cn("h-auto w-full object-contain", className)}
      />
    );
  }

  // Wajah ada di sekitar (45%, 33%) gambar; diperbesar ~2.7x lalu digeser ke tengah.
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-100 to-teal-50 ring-2 ring-white",
        className,
      )}
    >
      <Image
        src={SIGNA_SRC}
        alt="Signa"
        width={1254}
        height={1254}
        sizes="120px"
        priority={priority}
        className="pointer-events-none absolute max-w-none select-none"
        style={{ width: "270%", height: "auto", left: "-71%", top: "-38%" }}
      />
    </div>
  );
}
