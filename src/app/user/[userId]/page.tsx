import TopNavigation from "@/components/sections/top-navigation";
import Sidebar from "@/components/sections/sidebar";
import PreviewBanner from "@/components/sections/preview-banner";
import UserProfileClient from "@/components/profile/user-profile-client";

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return (
    <div className="min-h-screen bg-black text-white">
      <TopNavigation />
      
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
        <div className="hidden md:block shrink-0 relative z-10">
          <Sidebar />
        </div>
        
        <main className="relative z-0 flex-1 h-full overflow-y-auto scrollbar-unisin bg-gradient-to-b from-[#1a1a1a] to-[#121212] pb-20">
          <UserProfileClient userId={userId} />
        </main>
      </div>
      
      <PreviewBanner />
    </div>
  );
}