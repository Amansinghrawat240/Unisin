import TopNavigation from "@/components/sections/top-navigation";
import Sidebar from "@/components/sections/sidebar";
import PreviewBanner from "@/components/sections/preview-banner";
import { ProfileOverview } from "@/components/profile/profile-overview";
import { ProfilePlaylists } from "@/components/profile/profile-playlists";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <TopNavigation />
      {/* Match home layout: stack on mobile, show sidebar from md+ */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
        <div className="hidden md:block shrink-0 relative z-10">
          <Sidebar />
        </div>
        <main className="relative z-0 flex-1 h-full overflow-y-auto scrollbar-unisin bg-gradient-to-b from-[#1a1a1a] to-[#121212] p-4 sm:p-6 pb-32 md:pb-28">
          <div className="container">
            <div className="rounded-2xl border border-white/10 bg-[#181818]/80 px-4 py-4 sm:px-6 sm:py-6 shadow-xl">
              <h1 className="mb-4">Your profile</h1>
              <ProfileOverview />
              <ProfilePlaylists />
            </div>
          </div>
        </main>
      </div>
      <PreviewBanner />
    </div>
  );
}