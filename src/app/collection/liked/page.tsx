import TopNavigation from "@/components/sections/top-navigation";
import Sidebar from "@/components/sections/sidebar";
import PreviewBanner from "@/components/sections/preview-banner";
import { LikedSongsClient } from "@/components/library/liked-songs-client";

export default function LikedSongsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <TopNavigation />
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
        <div className="hidden md:block shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1a1a1a] to-[#121212] p-4 sm:p-6 pb-28 md:pb-28">
          <div className="max-w-5xl mx-auto">
            <LikedSongsClient />
          </div>
        </main>
      </div>
      <PreviewBanner />
    </div>
  );
}