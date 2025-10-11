"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export default function PopularArtists() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      // Check cache first
      const cached = getCachedData('popular-artists');
      if (cached) {
        setArtists(cached);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/browse/home');
        const data = await res.json().catch(() => ({}));
        const artistsList = Array.isArray(data?.popularArtists) ? data.popularArtists : [];
        const topArtists = artistsList.slice(0, 10); // Show top 10
        
        // Cache the data
        setCachedData('popular-artists', topArtists);
        setArtists(topArtists);
      } catch (error) {
        console.error('Failed to load popular artists:', error);
        setArtists([]);
      } finally {
        setLoading(false);
      }
    };
    loadArtists();
  }, []);

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (loading) {
    return (
      <section className="mb-8" aria-label="Popular artists">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Popular artists</h2>
        </div>
        <div className="grid grid-flow-col auto-cols-[182px] gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse p-4 bg-[#181818] rounded-lg">
              <div className="w-full aspect-square rounded-full bg-white/10 mb-4"></div>
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (artists.length === 0) {
    return (
      <section className="mb-8" aria-label="Popular artists">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Popular artists</h2>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#151515] p-6 text-sm text-muted-foreground">
          No popular artists yet.
        </div>
      </section>
    );
  }

  const artistInitial = (name: string) => name.slice(0, 1).toUpperCase();

  return (
    <section className="mb-8" aria-label="Popular artists">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">
          <Link
            href="/section/0JQ5DAnM3wGh0gz1MXnu3C"
            className="hover:underline"
          >
            Popular artists
          </Link>
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href="/section/0JQ5DAnM3wGh0gz1MXnu3C"
            className="text-sm font-bold text-muted-foreground hover:underline"
          >
            Show all
          </Link>
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollBy(-600)}
              className="rounded-full p-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollBy(600)}
              className="rounded-full p-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto pb-4 -mb-4 scrollbar-hide" ref={scrollerRef}>
        <div className="grid grid-flow-col auto-cols-[182px] gap-6">
          {artists.map((artist) => (
            <Link
              key={artist.id}
              href={`/artists/${artist.slug}`}
              className="group block p-4 bg-[#181818] hover:bg-[#282828] rounded-lg transition-colors duration-300"
            >
              <div className="relative w-full aspect-square rounded-full bg-[#282828] flex items-center justify-center overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.5)] mb-4">
                {artist.imageUrl ? (
                  <Image
                    src={artist.imageUrl}
                    alt={artist.name}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl font-bold text-white">{artistInitial(artist.name)}</span>
                )}
              </div>
              <div className="text-base text-white font-bold truncate">
                {artist.name}
              </div>
              <p className="text-sm text-muted-foreground">Artist</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}