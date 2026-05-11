import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground px-5 py-2 border-b border-border",
        className,
      )}
    >
      {items.map((crumb, i) => (
        <span key={`${crumb.label}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 ? <ChevronRight className="h-3 w-3 opacity-70" /> : null}
          {crumb.href && i < items.length - 1 ? (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? "text-foreground" : ""}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
