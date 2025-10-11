"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { usePlayer } from "@/lib/hooks/use-player";
import { toast } from "sonner";

// Simple cache with 5 minute TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

interface SectionItem {
  id: number;
  itemType: string;
  itemId: number;
  position: number;
  details?: {
    title?: string;
    name?: string;
    coverUrl?: string;
    imageUrl?: string;
    description?: string;
    bio?: string;
    slug?: string;
  };
}

interface Section {
  id: number;
  title: string;
  subtitle?: string;
  type: string;
  position: number;
  items: SectionItem[];
}

export default function DynamicHomepageSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const player = usePlayer();

  const handleItemClick = (item: SectionItem) => {
    if (item.itemType === "playlist") {
      router.push(`/playlists/${item.itemId}`);
    } else if (item.itemType === "track") {
      // Handle track click if needed
    } else if (item.itemType === "album") {
      router.push(`/albums/${item.itemId}`);
    } else if (item.itemType === "artist") {
      const slug = item.details?.slug || item.itemId;
      router.push(`/artists/${slug}`);
    }
  };

  const handlePlayPlaylist = async (e: React.MouseEvent, playlistId: number) => {
    e.stopPropagation();

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const res = await fetch(`/api/playlists/${playlistId}`, {
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Failed to load playlist");

      const data = await res.json();

      if (!data.tracks || data.tracks.length === 0) {
        toast.error("This playlist is empty");
        return;
      }

      const queue = data.tracks.map((t: any) => ({
        id: t.track.id,
        title: t.track.title,
        artists: (t.track.artists || []).map((a: any) => a.name),
        imageUrl: t.track.imageUrl || t.track.album?.coverUrl || "/favicon.ico",
        audioUrl: `/api/playback/stream/${t.track.id}?redirect=1`,
      }));

      player.playTrack(queue[0], true);
      toast.success(`Playing ${data.title || "playlist"}`);
    } catch (error) {
      console.error("Failed to play playlist:", error);
      toast.error("Unable to play playlist");
    }
  };

  const handlePlayTrack = (e: React.MouseEvent, item: SectionItem) => {
    e.stopPropagation();

    const track = {
      id: item.itemId,
      title: item.details?.title || item.details?.name || "Untitled",
      artists: [],
      imageUrl: item.details?.coverUrl || item.details?.imageUrl || "/placeholder-album.png",
      audioUrl: `/api/playback/stream/${item.itemId}?redirect=1`,
    };

    player.playTrack(track, true);
    toast.success(`Playing ${item.details?.title || item.details?.name || "Track"}`);
  };

  useEffect(() => {
    async function fetchSections() {
      const cached = getCachedData('homepage-sections');
      if (cached) {
        setSections(cached);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/browse/homepage");
        if (!res.ok) throw new Error("Failed to fetch sections");
        const data = await res.json();

        // API returns array directly, not wrapped in { sections: [...] }
        const sectionsArray = Array.isArray(data) ? data : [];

        setCachedData('homepage-sections', sectionsArray);
        setSections(sectionsArray);
      } catch (error) {
        console.error("Error fetching homepage sections:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSections();
  }, []);

  const visibleSections = useMemo(() => 
    sections.filter(s => s.items && s.items.length > 0),
    [sections]
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-8 w-48 bg-white/10 rounded mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="aspect-square bg-white/10 rounded-lg"></div>
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visibleSections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">No sections available yet. Add some content in the editor!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {visibleSections.map((section) => (
        <div key={section.id}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{section.title}</h2>
            <button className="text-sm font-semibold text-zinc-400 hover:text-white transition">
              Show all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {section.items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group cursor-pointer rounded-lg bg-[#181818] p-4 transition-all hover:bg-[#282828]"
              >
                <div className="relative mb-4 aspect-square overflow-hidden rounded-md">
                  <img
                    src={item.details?.coverUrl || item.details?.imageUrl || "/placeholder-album.png"}
                    alt={item.details?.title || item.details?.name || "Content"}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />

                  {(item.itemType === "playlist" || item.itemType === "track") && (
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                      <button
                        onClick={(e) => 
                          item.itemType === "playlist" 
                            ? handlePlayPlaylist(e, item.itemId)
                            : handlePlayTrack(e, item)
                        }
                        className="h-12 w-12 rounded-full bg-[#1db954] flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-[#1ed760] transition-transform"
                        aria-label={`Play ${item.itemType}`}
                      >
                        <Play className="h-5 w-5 text-black fill-black ml-0.5" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="mb-1 truncate text-sm font-semibold text-white">
                  {item.details?.title || item.details?.name || "Untitled"}
                </h3>
                {(item.details?.description || item.details?.bio) && (
                  <p className="line-clamp-2 text-xs text-zinc-400">
                    {item.details.description || item.details.bio}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}