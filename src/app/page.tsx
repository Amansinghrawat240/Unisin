"use client";

import { lazy, Suspense, useState, useEffect } from "react";
import TopNavigation from "@/components/sections/top-navigation";
import Sidebar from "@/components/sections/sidebar";
import MobileMenu from "@/components/sections/mobile-menu";
import MobileBottomNav from "@/components/sections/mobile-bottom-nav";

// Lazy load below-the-fold components
const PreviewBanner = lazy(() => import("@/components/sections/preview-banner"));
const DynamicHomepageSections = lazy(() => import("@/components/sections/dynamic-homepage-sections"));
const Footer = lazy(() => import("@/components/sections/footer"));

// Loading skeleton component
function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-white/10 rounded"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square bg-white/10 rounded-lg"></div>
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [greeting, setGreeting] = useState("Good evening");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-0">
      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden md:block">
        <TopNavigation />
      </div>
      
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden flex items-center justify-between bg-[#1a1a1a] px-4 py-4">
        <h1 className="text-2xl font-bold text-white">{greeting}</h1>
        <MobileMenu />
      </div>
      
      {/* Layout: stack on mobile, sidebar visible from md+ */}
      <div className="flex flex-col md:flex-row md:h-[calc(100vh-64px)]">
        <div className="hidden md:block shrink-0 relative z-10">
          <Sidebar />
        </div>
        
        <main className="relative z-0 flex-1 h-full overflow-y-auto scrollbar-unisin bg-gradient-to-b from-[#1a1a1a] to-[#121212] p-0 md:p-6 pb-0 md:pb-20">
          <div className="md:container">
            <div className="mt-0 md:mt-8 px-4 md:px-0">
              <Suspense fallback={<SectionSkeleton />}>
                <DynamicHomepageSections />
              </Suspense>
            </div>

            <Suspense fallback={<div className="h-20"></div>}>
              <Footer />
            </Suspense>
          </div>
        </main>
      </div>
      
      {/* Preview Banner - Hidden on mobile */}
      <div className="hidden md:block">
        <Suspense fallback={null}>
          <PreviewBanner />
        </Suspense>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
