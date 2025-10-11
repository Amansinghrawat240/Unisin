"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const AdminNav = () => {
  const pathname = usePathname();
  const tabs = [
    { href: "/admin/moderation", label: "Moderation" },
    { href: "/admin/tracks", label: "Tracks" },
    { href: "/admin/dropbox", label: "Dropbox" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#121212]/80 backdrop-blur supports-[backdrop-filter]:bg-[#121212]/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="rounded bg-[#1db954] px-2 py-0.5 text-xs font-bold text-black">ADMIN</span>
          <h1 className="text-lg font-semibold text-white">Dashboard</h1>
        </div>
        <nav className="flex items-center gap-1 rounded-md bg-[#1a1a1a] p-1">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname?.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "rounded-md px-3 py-1.5 text-sm transition " +
                  (active
                    ? "bg-[#2a2a2a] text-white"
                    : "text-zinc-300 hover:text-white hover:bg-[#222]")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default AdminNav;