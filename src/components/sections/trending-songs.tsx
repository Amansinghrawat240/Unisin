"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { usePlayer } from "@/lib/hooks/use-player";
import { toast } from "sonner";
import { LikeButton } from "@/components/ui/like-button";

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

interface Artist {
  id?: string | number;
  name: string;
  slug?: string; // CRITICAL: Add slug for proper routing
  href: string;
  userId?: string | null; // CRITICAL: userId indicates uploader, link to user profile
}

interface Song {
  id?: string | number;
  imageUrl: string;
  title: string;
  artists: Artist[];
  albumUrl: string;
  isExplicit: boolean;
  audioUrl: string;
}

type PlayerQueueItem = {
  id?: string | number; // keep id so player queue items carry identity
  title: string;
  artists: string[];
  imageUrl: string;
  audioUrl: string;
};

export default function TrendingSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const player = usePlayer();
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchTrendingSongs() {
      // Check cache first
      const cached = getCachedData('trending-songs');
      if (cached) {
        setSongs(cached);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/tracks?limit=20&sort=plays");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        
        // Cache the data
        setCachedData('trending-songs', data.tracks || []);
        setSongs(data.tracks || []);
      } catch (error) {
        console.error("Error fetching trending songs:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrendingSongs();
  }, []);

  // Memoize play handler to avoid recreating on every render
  const handlePlay = useMemo(() => (song: Song) => {
    const track = {
      id: song.id,
      title: song.title,
      artists: song.artists?.map(a => a.name) || [],
      imageUrl: song.imageUrl || "/placeholder-album.png",
      audioUrl: `/api/playback/stream/${song.id}?redirect=1`,
    };

    player.playTrack(track, true);
    toast.success(`Playing ${song.title}`);
  }, [player]);

  if (isLoading) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Trending songs</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="aspect-square bg-white/10 rounded-lg"></div>
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="h-3 bg-white/10 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Trending songs" className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Trending songs</h2>
        <Link href="/section/0JQ5DB5E8N831KzFzsBBQ2" className="text-sm font-bold text-muted-foreground hover:text-white">
          Show all
        </Link>
      </div>

      <div className="relative group">
        {/* Left/Right chevrons like Unisin */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollerRef.current?.scrollBy({ left: -600, behavior: 'smooth' })}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-lg opacity-0 group-hover:opacity-100 hover:bg-black/80 transition"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollerRef.current?.scrollBy({ left: 600, behavior: 'smooth' })}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-lg opacity-0 group-hover:opacity-100 hover:bg-black/80 transition"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* edge gradients */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#121212] to-transparent hidden md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#121212] to-transparent hidden md:block" />

        <div ref={scrollerRef} className="grid grid-flow-col auto-cols-[200px] gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {(songs || []).map((song, index) => (
            <div key={index} className="bg-[#1a1a1a] p-4 rounded-lg hover:bg-[#282828] transition-all duration-300 group w-[200px]">
              <div className="relative mb-4">
                <Link href={song.albumUrl} draggable="false">
                  <Image
                    src={song.imageUrl}
                    alt={`Album art for ${song.title}`}
                    width={180}
                    height={180}
                    className="h-[180px] w-[180px] rounded shadow-lg object-cover"
                  />
                </Link>
                {song.audioUrl && (
                  <button
                    className="absolute bottom-2 right-2 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-2xl hover:scale-105 hover:bg-[#1ed760]"
                    aria-label={`Play ${song.title}`}
                    onClick={() => handlePlay(song)}
                  >
                    <Play className="fill-black text-black ml-0.5" size={20} />
                  </button>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Link href={song.albumUrl} draggable="false" className="block">
                    <h3 className="font-bold text-white text-base truncate hover:underline">{song.title}</h3>
                  </Link>
                  <div className="text-sm text-muted-foreground mt-1 truncate">
                    {song.isExplicit && (
                      <span className="inline-flex items-center justify-center w-4 h-4 mr-1 text-[10px] font-bold bg-[#6a6a6a] text-background rounded-sm align-middle leading-none">
                        E
                      </span>
                    )}
                    <span className="align-middle">
                      {song.artists.map((artist, i) => (
                        <>
                          {artist.userId ? (
                            <Link href={`/user/${artist.userId}`} className="hover:underline" draggable="false" onClick={(e) => e.stopPropagation()}>
                              {artist.name}
                            </Link>
                          ) : artist.slug ? (
                            <Link href={`/artists/${artist.slug}`} className="hover:underline" draggable="false" onClick={(e) => e.stopPropagation()}>
                              {artist.name}
                            </Link>
                          ) : (
                            <span className="hover:underline">{artist.name}</span>
                          )}
                          {i < song.artists.length - 1 && ', '}
                        </>
                      ))}
                    </span>
                  </div>
                </div>
                {song.id && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <LikeButton trackId={typeof song.id === 'number' ? song.id : 0} size="sm" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}