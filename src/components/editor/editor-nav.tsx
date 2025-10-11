"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, Layout, Undo2, LogOut } from "lucide-react";

export function EditorNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/editor", label: "Homepage Sections", icon: Layout },
    { href: "/editor/music", label: "Music Manager", icon: Music },
    { href: "/editor/history", label: "History & Undo", icon: Undo2 },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/editor" className="text-lg font-bold text-primary">
            Editor Panel
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:border-white/40 transition"
          >
            View Site
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:border-white/40 transition"
          >
            <LogOut className="h-3 w-3" />
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}