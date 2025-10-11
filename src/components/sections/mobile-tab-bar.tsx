"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Download } from "lucide-react";

export default function MobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/library", icon: Library, label: "Your Library" },
    { href: "/download", icon: Download, label: "Get App" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
            >
              <Icon
                className={`h-6 w-6 ${
                  isActive ? "text-white" : "text-zinc-400"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-white" : "text-zinc-400"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}