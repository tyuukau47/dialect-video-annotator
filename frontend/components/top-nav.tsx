"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";


const items = [
  { href: "/annotation", label: "Annotation" },
  { href: "/videos", label: "Videos" },
  { href: "/voices", label: "Voices" },
  { href: "/vocabularies", label: "Vocabularies" },
  { href: "/admin/voices", label: "Admin" },
];


export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Dataset Tool</div>
          <div className="text-2xl font-semibold text-ink">Dialect Video Annotator</div>
        </div>
        <nav className="flex gap-2 rounded-2xl bg-mist p-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-xl px-4 py-2 text-sm font-medium transition",
                pathname.startsWith(item.href)
                  ? "bg-accent text-white shadow-panel"
                  : "text-slate-600 hover:bg-white hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
