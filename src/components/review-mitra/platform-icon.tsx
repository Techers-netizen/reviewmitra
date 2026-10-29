import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  google: "bg-white text-[#4285F4] border-[#4285F4]/30 shadow-sm",
  facebook: "bg-white text-[#1877F2] border-[#1877F2]/30 shadow-sm",
  justdial: "bg-white text-[#F04E23] border-[#F04E23]/30 shadow-sm",
  indiamart: "bg-white text-[#1D4ED8] border-[#1D4ED8]/30 shadow-sm",
  qr_direct: "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm",
};

const LABELS: Record<string, string> = {
  google: "G",
  facebook: "f",
  justdial: "Jd",
  indiamart: "IM",
  qr_direct: "QR",
};

const FULL: Record<string, string> = {
  google: "Google Maps",
  facebook: "Facebook Page",
  justdial: "Justdial",
  indiamart: "IndiaMART",
  qr_direct: "In-Store QR",
};

export function PlatformIcon({
  platform,
  size = 28,
  className,
}: {
  platform: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-bold select-none",
        STYLES[platform] || "bg-muted text-muted-foreground border-border",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={FULL[platform] || platform}
      aria-label={FULL[platform] || platform}
    >
      {LABELS[platform] || platform[0]?.toUpperCase()}
    </span>
  );
}

export function PlatformPill({ platform, active }: { platform: string; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-border bg-card text-muted-foreground"
      )}
    >
      <PlatformIcon platform={platform} size={18} />
      {FULL[platform] || platform}
    </span>
  );
}
