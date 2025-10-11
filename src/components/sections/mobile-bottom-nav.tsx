"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Search, Library, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isWebView, setIsWebView] = useState(false);

  // Detect if running in WebView
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroidWebView = 
      /wv/.test(userAgent) || 
      /Android.*AppleWebKit(?!.*Chrome)/.test(userAgent) ||
      typeof (window as any).AndroidInterface !== "undefined";
    
    setIsWebView(isAndroidWebView);
  }, []);

  const handleNavigation = (path: string) => {
    if (isWebView) {
      window.location.href = path;
    } else {
      router.push(path);
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => handleNavigation("/")}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition ${
            isActive("/") && !isActive("/library") && !isActive("/search")
              ? "text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs font-medium">Home</span>
        </button>

        <button
          onClick={() => handleNavigation("/search")}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition ${
            isActive("/search") ? "text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <Search className="h-6 w-6" />
          <span className="text-xs font-medium">Search</span>
        </button>

        <button
          onClick={() => handleNavigation("/library")}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition ${
            isActive("/library") ? "text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <Library className="h-6 w-6" />
          <span className="text-xs font-medium">Your Library</span>
        </button>

        <button
          onClick={() => handleNavigation("/creator")}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition ${
            isActive("/creator") ? "text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <Plus className="h-6 w-6" />
          <span className="text-xs font-medium">Creator</span>
        </button>
      </div>
    </nav>
  );
}