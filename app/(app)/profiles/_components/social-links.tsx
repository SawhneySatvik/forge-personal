import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SocialLinks({
  x,
  linkedin,
}: {
  x: string | null;
  linkedin: string | null;
}) {
  const items: { label: string; href: string }[] = [];
  if (x) items.push({ label: "X", href: `https://x.com/${x.replace(/^@/, "")}` });
  if (linkedin) items.push({ label: "LinkedIn", href: linkedin });
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <a key={it.label} href={it.href} target="_blank" rel="noopener noreferrer">
          <Badge variant="outline" className="gap-1">
            <ExternalLink className="size-3" /> {it.label}
          </Badge>
        </a>
      ))}
    </div>
  );
}
