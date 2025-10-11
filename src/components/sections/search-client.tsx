"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/hooks/use-player";
import { Search, MoreHorizontal, Plus, ListPlus, Heart, Share2, ListMusic } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { LikeButton } from "@/components/ui/like-button";
import { useSession } from "@/lib/auth-client";

interface TrackResult {
  id: number;
  title: string;
  durationSec: number;
  audioUrl: string;
  imageUrl: string | null;
  popularity: number | null;
  explicit: boolean;
  albumId?: number | null;
}

interface AlbumResult {
  id: number;
  title: string;
  artistId: number | null;
  coverUrl: string | null;
  releaseDate: number | null;
}

interface ArtistResult {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  popularity: number | null;
}

type SearchType = "all" | "track" | "album" | "artist";

export default function SearchClient() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [q, setQ] = useState("");
  const [type, setType] = useState<SearchType>("all");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { playTrack, addToQueue } = usePlayer();
  const searchParams = useSearchParams();

  const debouncedQ = useDebounce(q, 1000);

  // Sync query and type from URL (?q=...&type=...)
  useEffect(() => {
    const qp = (searchParams.get("q") || "").trim();
    const tp = (searchParams.get("type") as SearchType) || "all";
    if (qp && qp !== q) setQ(qp);
    if (tp !== type) setType(tp);
  }, [searchParams, q, type]);

  // Helper flags for empty states
  const hasAnyAllResults = useMemo(() => {
    const c = data?.categories;
    if (!c) return false;
    return Boolean((c.tracks?.length || 0) + (c.albums?.length || 0) + (c.artists?.length || 0));
  }, [data]);
  const hasTabResults = useMemo(() => Array.isArray(data?.results) && data.results.length > 0, [data]);

  useEffect(() => {
    // Don't search for queries shorter than 2 characters
    if (!debouncedQ || debouncedQ.trim().length < 2) {
      setData(null);
      setHasSearched(false);
      return;
    }

    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ q: debouncedQ, type, limit: "20" });
        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        setData(json);
        setHasSearched(true);
      } catch (e) {
        if ((e as any).name !== "AbortError") {
          // noop
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [debouncedQ, type]);

  const onPlay = (t: TrackResult) => {
    // Use direct audioUrl if available, otherwise use streaming endpoint
    const audioUrl = t.audioUrl || `/api/playback/stream/${t.id}?redirect=1`;
    playTrack({
      id: String(t.id),
      title: t.title,
      artists: [],
      imageUrl: t.imageUrl || "/favicon.ico",
      audioUrl,
    });
  };

  // Cache user playlists for "Add to playlist"
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const loadPlaylists = async () => {
    // Refetch if empty; only skip when we already have a non-empty list
    if ((playlists && playlists.length > 0) || loadingPlaylists) return;
    
    // Check if user is authenticated via session
    if (!session?.user) {
      setPlaylists([]);
      setLoadingPlaylists(false);
      return;
    }
    
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const controller = new AbortController();
    try {
      setLoadingPlaylists(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;

      // Add a hard timeout so the UI never sits on "Loading…" indefinitely
      timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch("/api/me/library", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
        signal: controller.signal,
      });

      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setPlaylists([]);
        return;
      }
      if (!res.ok) {
        setPlaylists([]);
        toast.error(json?.error || "Could not load playlists");
        return;
      }
      const own = Array.isArray(json?.own) ? json.own : [];
      // Only show user's own playlists; hide followed
      setPlaylists([...(own || [])]);
    } catch (err: any) {
      // Handle network/abort errors gracefully
      setPlaylists([]);
      if (err?.name === "AbortError") {
        toast.error("Loading playlists timed out. Please try again.");
      } else {
        toast.error("Failed to load playlists");
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoadingPlaylists(false);
    }
  };

  // Prefetch playlists once on mount if user is logged in so submenu opens instantly
  useEffect(() => {
    if (session?.user && !sessionLoading) {
      loadPlaylists();
    }
  }, [session?.user, sessionLoading]);

  const handleAddToPlaylist = async (playlistId: number, trackId: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ trackId }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        toast.success("Added to playlist");
      } else {
        const msg = await res.json().catch(() => ({}));
        toast.error(msg?.error || "Could not add to playlist");
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        toast.error("Adding to playlist timed out. Please try again.");
      } else {
        toast.error("Failed to add to playlist");
      }
    }
  };

  const handleLike = async (trackId: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
    if (!token) return;
    await fetch(`/api/me/likes/${trackId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const handleShare = async (t: TrackResult) => {
    const url = t.audioUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // no-op
    }
  };

  const renderTracks = (tracks: TrackResult[]) => (
    <div className="grid grid-cols-1 gap-2">
      {tracks.map((t) => (
        <Card key={t.id} className="bg-background-secondary border-border/40">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-12 w-12 rounded bg-muted overflow-hidden flex-shrink-0">
              {t.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.imageUrl} alt={t.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.title}</p>
              <p className="text-xs text-muted-foreground">{Math.round((t.durationSec || 0) / 60)}m {((t.durationSec || 0) % 60)}s</p>
            </div>
            <div className="flex items-center gap-2">
              <LikeButton trackId={t.id} size="sm" />
              <Button size="sm" className="bg-[#1db954] hover:bg-[#18a84d]" onClick={() => onPlay(t)}>
                Play
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuSub onOpenChange={(open) => { if (open) loadPlaylists(); }}>
                    <DropdownMenuSubTrigger>
                      <ListPlus className="mr-2 h-4 w-4" />
                      <span>Add to playlist</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-64 w-64 overflow-y-auto">
                      {(loadingPlaylists || sessionLoading) && (
                        <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
                      )}
                      {!loadingPlaylists && !sessionLoading && !session?.user && (
                        <DropdownMenuItem disabled>Log in to see your playlists</DropdownMenuItem>
                      )}
                      {!loadingPlaylists && !sessionLoading && session?.user && Array.isArray(playlists) && playlists.length === 0 && (
                        <DropdownMenuItem disabled>No playlists</DropdownMenuItem>
                      )}
                      {!loadingPlaylists && !sessionLoading && session?.user && Array.isArray(playlists) && playlists.length > 0 && (
                        <>
                          {playlists.map((pl: any) => (
                            <DropdownMenuItem key={pl.id} onClick={() => handleAddToPlaylist(Number(pl.id), t.id)}>
                              <Plus className="mr-2 h-4 w-4" />
                              <span className="truncate">{pl.title || pl.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuItem onClick={() => addToQueue({ 
                    id: String(t.id), 
                    title: t.title, 
                    artists: [], 
                    imageUrl: t.imageUrl || "/favicon.ico", 
                    audioUrl: t.audioUrl || `/api/playback/stream/${t.id}?redirect=1`
                  })}>
                    <ListMusic className="mr-2 h-4 w-4" />
                    <span>Add to queue</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => handleShare(t)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderAlbums = (albums: AlbumResult[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {albums.map((a) => (
        <div key={a.id} className="bg-background-secondary rounded-lg p-3 border border-border/40">
          <div className="aspect-square rounded mb-3 overflow-hidden bg-muted">
            {a.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.coverUrl} alt={a.title} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <p className="text-sm font-medium truncate">{a.title}</p>
        </div>
      ))}
    </div>
  );

  const renderArtists = (artistsData: ArtistResult[]) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {artistsData.map((a) => (
        <Link 
          key={a.id} 
          href={`/artists/${a.slug}`}
          className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="h-24 w-24 rounded-full overflow-hidden bg-muted">
            {a.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.imageUrl} alt={a.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <p className="text-sm font-medium text-center truncate max-w-[120px]">{a.name}</p>
        </Link>
      ))}
    </div>
  );

  const allTabContent = useMemo(() => {
    if (!data || !data.categories) return null;
    return (
      <div className="space-y-8">
        {data.categories.tracks?.length ? (
          <section>
            <h2 className="text-xl font-bold mb-3">Songs</h2>
            {renderTracks(data.categories.tracks)}
          </section>
        ) : null}
        {data.categories.albums?.length ? (
          <section>
            <h2 className="text-xl font-bold mb-3">Albums</h2>
            {renderAlbums(data.categories.albums)}
          </section>
        ) : null}
        {data.categories.artists?.length ? (
          <section>
            <h2 className="text-xl font-bold mb-3">Artists</h2>
            {renderArtists(data.categories.artists)}
          </section>
        ) : null}
      </div>
    );
  }, [data]);

  // Browse categories for mobile
  const browseCategories = [
    { id: 1, name: "Music", color: "bg-[#e91e63]", link: "/" },
    { id: 2, name: "Podcasts", color: "bg-[#0d7377]", link: "/" },
    { id: 3, name: "Live Events", color: "bg-[#8b5cf6]", link: "/" },
    { id: 4, name: "Made For You", color: "bg-[#3b4d91]", link: "/" },
    { id: 5, name: "New Releases", color: "bg-[#7d8a2e]", link: "/" },
    { id: 6, name: "Rain & Monsoon", color: "bg-[#0d7377]", link: "/" },
    { id: 7, name: "Hindi", color: "bg-[#e91e63]", link: "/" },
    { id: 8, name: "Telugu", color: "bg-[#d97706]", link: "/" },
  ];

  // Show browse categories when not searching
  const showBrowseCategories = !isSearching && !hasSearched && !q.trim();

  return (
    <div className="space-y-6">
      {/* Mobile-first search header */}
      <div className="md:hidden">
        <h1 className="text-3xl font-bold mb-4">Search</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setIsSearching(true)}
            placeholder="What do you want to listen to?"
            className="pl-9 bg-white text-black placeholder:text-zinc-700 border-0 focus-visible:ring-0 h-12 rounded-md"
          />
        </div>
      </div>

      {/* Browse all section for mobile */}
      {showBrowseCategories && (
        <div className="md:hidden">
          <h2 className="text-xl font-bold mb-4">Browse all</h2>
          <div className="grid grid-cols-2 gap-3">
            {browseCategories.map((category) => (
              <Link
                key={category.id}
                href={category.link}
                className={`${category.color} rounded-lg p-4 h-24 flex items-end justify-start relative overflow-hidden hover:opacity-90 transition-opacity`}
              >
                <span className="text-white font-bold text-lg">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Desktop/Search results view */}
      <div className={showBrowseCategories ? "hidden md:block" : "block"}>
        <Tabs value={type} onValueChange={(v) => setType(v as SearchType)}>
          <TabsList className="bg-background-secondary border border-border/40">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="track">Songs</TabsTrigger>
            <TabsTrigger value="artist">Artists</TabsTrigger>
            <TabsTrigger value="album">Albums</TabsTrigger>
          </TabsList>

          <div className="mt-4 min-h-40">
            {loading && <p className="text-sm text-muted-foreground">Searching…</p>}
            {!loading && !hasSearched && <p className="text-sm text-muted-foreground">Try searching for songs, artists, or albums.</p>}

            <TabsContent value="all">
              {!loading && hasSearched && hasAnyAllResults && allTabContent}
              {!loading && hasSearched && !hasAnyAllResults && (
                <div className="mt-6 rounded-lg border border-border/40 bg-background-secondary p-6 text-center">
                  <p className="text-sm text-muted-foreground">No results for "{q}".</p>
                  <div className="mt-3">
                    <Button className="bg-[#1db954] hover:bg-[#18a84d]" asChild>
                      <a href={`/creator?title=${encodeURIComponent(q)}`}>Can't find it? Publish it on Unisin</a>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="track">
              {!loading && data?.results && renderTracks(data.results)}
              {!loading && hasSearched && !hasTabResults && (
                <div className="mt-6 rounded-lg border border-border/40 bg-background-secondary p-6 text-center">
                  <p className="text-sm text-muted-foreground">No songs match "{q}".</p>
                  <div className="mt-3">
                    <Button className="bg-[#1db954] hover:bg-[#18a84d]" asChild>
                      <a href={`/creator?title=${encodeURIComponent(q)}`}>Become a creator and upload it</a>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="artist">
              {!loading && data?.results && renderArtists(data.results)}
              {!loading && hasSearched && !hasTabResults && (
                <div className="mt-6 rounded-lg border border-border/40 bg-background-secondary p-6 text-center">
                  <p className="text-sm text-muted-foreground">No artists match "{q}".</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="album">
              {!loading && data?.results && renderAlbums(data.results)}
              {!loading && hasSearched && !hasTabResults && (
                <div className="mt-6 rounded-lg border border-border/40 bg-background-secondary p-6 text-center">
                  <p className="text-sm text-muted-foreground">No albums match "{q}".</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
