import { Suspense } from "react";
import TopNavigation from "@/components/sections/top-navigation";
import Sidebar from "@/components/sections/sidebar";
import PreviewBanner from "@/components/sections/preview-banner";
import SearchClient from "@/components/sections/search-client";

export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden md:block">
        <TopNavigation />
      </div>

      {/* Layout: stack on mobile, sidebar visible from md+ */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
        <div className="hidden md:block shrink-0">
          <Sidebar />
        </div>

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1a1a1a] to-[#121212] p-4 sm:p-6 pb-28 md:pb-28 text-white">
          <div className="max-w-5xl mx-auto">
            <Suspense fallback={
              <div className="space-y-6">
                <div className="animate-pulse">
                  <div className="h-12 bg-white/10 rounded-lg mb-8"></div>
                  <div className="h-8 w-48 bg-white/10 rounded mb-4"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-24 bg-white/10 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </div>
            }>
              <SearchClient />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Preview Banner - Hidden on mobile */}
      <div className="hidden md:block">
        <PreviewBanner />
      </div>
    </div>
  );
}