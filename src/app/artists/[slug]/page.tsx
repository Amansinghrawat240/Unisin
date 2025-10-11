import { notFound } from "next/navigation";
import ArtistProfileClient from "@/components/profile/artist-profile-client";
import TopNavigation from "@/components/sections/top-navigation";
import Sidebar from "@/components/sections/sidebar";
import PreviewBanner from "@/components/sections/preview-banner";

interface ArtistPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNavigation />
      
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
        <div className="hidden md:block shrink-0 relative z-10">
          <Sidebar />
        </div>
        
        <main className="relative z-0 flex-1 h-full overflow-y-auto scrollbar-unisin bg-gradient-to-b from-[#1a1a1a] to-[#121212] p-4 sm:p-6 pb-20">
          <ArtistProfileClient slug={slug} />
        </main>
      </div>
      
      <PreviewBanner />
    </div>
  );
}