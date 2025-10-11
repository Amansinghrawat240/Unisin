"use client";

import TopNavigation from "@/components/sections/top-navigation";
import MobileBottomNav from "@/components/sections/mobile-bottom-nav";
import { useEffect, useState } from "react";

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const [isWebView, setIsWebView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroidWebView = 
      /wv/.test(userAgent) || 
      /Android.*AppleWebKit(?!.*Chrome)/.test(userAgent) ||
      typeof (window as any).AndroidInterface !== "undefined";
    
    // Check if mobile device
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    setIsWebView(isAndroidWebView);
    setIsMobile(checkMobile || window.innerWidth < 768);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {!isWebView && <TopNavigation />}
      <main className={`bg-gradient-to-b from-[#1a1a1a] to-[#121212] ${
        isWebView || isMobile ? 'min-h-screen pb-20 pt-4' : 'min-h-[calc(100vh-64px)]'
      }`}>
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 py-4 sm:py-6">
          {children}
        </div>
      </main>
      {(isWebView || isMobile) && <MobileBottomNav />}
    </div>
  );
}