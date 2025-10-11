import TopNavigation from "@/components/sections/top-navigation";
import Sidebar from "@/components/sections/sidebar";
import PlaylistViewer from "@/components/playlists/playlist-viewer";

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="hidden md:block">
        <TopNavigation />
      </div>
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
        <div className="hidden md:block shrink-0 relative z-10">
          <Sidebar />
        </div>
        <main className="relative z-0 flex-1 h-full overflow-y-auto scrollbar-unisin bg-gradient-to-b from-[#1a1a1a] to-[#121212] pb-32 md:pb-28">
          <PlaylistViewer id={id} />
        </main>
      </div>
    </div>
  );
}