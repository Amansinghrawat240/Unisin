"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Plus, Grid3x3, List, Clock, Heart } from "lucide-react";
import TopNavigation from "@/components/sections/top-navigation";
import Sidebar from "@/components/sections/sidebar";
import PreviewBanner from "@/components/sections/preview-banner";
import MobileMenu from "@/components/sections/mobile-menu";
import MobileBottomNav from "@/components/sections/mobile-bottom-nav";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type TabType = "playlists" | "albums" | "artists";
type ViewType = "list" | "grid";

interface Playlist {
  id: number;
  title: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  trackCount: number;
}

interface Artist {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export default function LibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("playlists");
  const [viewType, setViewType] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [followedArtists, setFollowedArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likedSongsCount, setLikedSongsCount] = useState(0);

  useEffect(() => {
    loadLibrary();
    loadLikedSongsCount();
  }, []);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      
      const res = await fetch("/api/me/library", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error("Failed to load library");
      }

      const data = await res.json();
      setPlaylists([...(data.own || []), ...(data.followed || [])]);
      setFollowedArtists(data.followedArtists || []);
    } catch (error) {
      console.error("Load library error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLikedSongsCount = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/me/likes", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setLikedSongsCount(data.results?.length || 0);
      }
    } catch (error) {
      console.error("Load liked songs count error:", error);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a playlist title");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("bearer_token");

      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          isPublic: false,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create playlist");
      }

      toast.success("Playlist created!");
      setOpen(false);
      setTitle("");
      setDescription("");
      loadLibrary();
    } catch (error: any) {
      toast.error(error.message || "Failed to create playlist");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPlaylists = playlists.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArtists = followedArtists.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white pb-16 md:pb-0">
      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden md:block">
        <TopNavigation />
      </div>
      
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden sticky top-0 z-50 flex items-center justify-between bg-black px-4 py-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white">Your Library</h1>
        <MobileMenu />
      </div>
      
      <div className="flex flex-col md:flex-row md:h-[calc(100vh-64px)]">
        <div className="hidden md:block shrink-0 relative z-10">
          <Sidebar />
        </div>
        
        <main className="relative z-0 flex-1 h-full overflow-y-auto scrollbar-unisin bg-black">
          <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-white hidden md:block">Your Library</h1>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 md:flex-none md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                    <input
                      type="text"
                      placeholder="Search in Your Library"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#242424] text-white placeholder:text-white/60 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>
                  <button
                    onClick={() => setOpen(true)}
                    className="p-2 hover:bg-white/10 rounded-full transition"
                    title="Create playlist"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-none pb-2">
                <button
                  onClick={() => setActiveTab("playlists")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition ${
                    activeTab === "playlists"
                      ? "bg-white text-black"
                      : "bg-[#232323] text-white hover:bg-[#2a2a2a]"
                  }`}
                >
                  Playlists
                </button>
                <button
                  onClick={() => setActiveTab("albums")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition ${
                    activeTab === "albums"
                      ? "bg-white text-black"
                      : "bg-[#232323] text-white hover:bg-[#2a2a2a]"
                  }`}
                >
                  Albums
                </button>
                <button
                  onClick={() => setActiveTab("artists")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition ${
                    activeTab === "artists"
                      ? "bg-white text-black"
                      : "bg-[#232323] text-white hover:bg-[#2a2a2a]"
                  }`}
                >
                  Artists
                </button>
              </div>

              {/* View toggle and sort */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewType("list")}
                    className={`p-2 rounded transition ${
                      viewType === "list" ? "text-white" : "text-white/60 hover:text-white"
                    }`}
                    title="List view"
                  >
                    <List className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewType("grid")}
                    className={`p-2 rounded transition ${
                      viewType === "grid" ? "text-white" : "text-white/60 hover:text-white"
                    }`}
                    title="Grid view"
                  >
                    <Grid3x3 className="h-5 w-5" />
                  </button>
                </div>
                <button className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition">
                  <Clock className="h-4 w-4" />
                  <span>Recents</span>
                </button>
              </div>
            </div>

            {/* Content */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <p className="text-white/60">Loading your library...</p>
              </div>
            )}

            {!loading && activeTab === "playlists" && (
              <div>
                {filteredPlaylists.length === 0 ? (
                  <div>
                    {viewType === "list" ? (
                      <div className="space-y-2">
                        {/* Liked Songs - Always visible */}
                        <Link
                          href="/collection/liked"
                          className="flex items-center gap-4 p-2 rounded-md hover:bg-white/5 transition group"
                        >
                          <div className="h-16 w-16 rounded bg-gradient-to-br from-[#5a4bff] via-[#9b5cf6] to-[#e91e63] flex items-center justify-center overflow-hidden shrink-0">
                            <Heart className="h-8 w-8 text-white fill-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-white truncate">Liked Songs</p>
                            <p className="text-sm text-white/60 truncate">
                              Playlist • {likedSongsCount} {likedSongsCount === 1 ? 'song' : 'songs'}
                            </p>
                          </div>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {/* Liked Songs - Grid view */}
                        <Link
                          href="/collection/liked"
                          className="group"
                        >
                          <div className="bg-[#181818] rounded-md p-4 hover:bg-[#282828] transition">
                            <div className="aspect-square rounded bg-gradient-to-br from-[#5a4bff] via-[#9b5cf6] to-[#e91e63] flex items-center justify-center overflow-hidden mb-4">
                              <Heart className="h-16 w-16 text-white fill-white" />
                            </div>
                            <p className="text-sm font-medium text-white truncate mb-1">Liked Songs</p>
                            <p className="text-xs text-white/60 truncate">
                              Playlist • {likedSongsCount} {likedSongsCount === 1 ? 'song' : 'songs'}
                            </p>
                          </div>
                        </Link>
                      </div>
                    )}
                    
                    <div className="text-center py-12">
                      <p className="text-white/60 mb-2">No playlists found</p>
                      <button
                        onClick={() => setOpen(true)}
                        className="text-sm text-white hover:underline"
                      >
                        Create your first playlist
                      </button>
                    </div>
                  </div>
                ) : viewType === "list" ? (
                  <div className="space-y-2">
                    {/* Liked Songs - Always show first */}
                    <Link
                      href="/collection/liked"
                      className="flex items-center gap-4 p-2 rounded-md hover:bg-white/5 transition group"
                    >
                      <div className="h-16 w-16 rounded bg-gradient-to-br from-[#5a4bff] via-[#9b5cf6] to-[#e91e63] flex items-center justify-center overflow-hidden shrink-0">
                        <Heart className="h-8 w-8 text-white fill-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-white truncate">Liked Songs</p>
                        <p className="text-sm text-white/60 truncate">
                          Playlist • {likedSongsCount} {likedSongsCount === 1 ? 'song' : 'songs'}
                        </p>
                      </div>
                    </Link>

                    {filteredPlaylists.map((playlist) => (
                      <Link
                        key={playlist.id}
                        href={`/playlists/${playlist.id}`}
                        className="flex items-center gap-4 p-2 rounded-md hover:bg-white/5 transition group"
                      >
                        <div className="h-16 w-16 rounded bg-[#282828] flex items-center justify-center overflow-hidden shrink-0">
                          {playlist.coverUrl ? (
                            <Image
                              src={playlist.coverUrl}
                              alt={playlist.title}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl font-bold text-white">{playlist.title[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-white truncate">{playlist.title}</p>
                          <p className="text-sm text-white/60 truncate">
                            Playlist • {playlist.trackCount || 0} songs
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {/* Liked Songs - Grid view */}
                    <Link
                      href="/collection/liked"
                      className="group"
                    >
                      <div className="bg-[#181818] rounded-md p-4 hover:bg-[#282828] transition">
                        <div className="aspect-square rounded bg-gradient-to-br from-[#5a4bff] via-[#9b5cf6] to-[#e91e63] flex items-center justify-center overflow-hidden mb-4">
                          <Heart className="h-16 w-16 text-white fill-white" />
                        </div>
                        <p className="text-sm font-medium text-white truncate mb-1">Liked Songs</p>
                        <p className="text-xs text-white/60 truncate">
                          Playlist • {likedSongsCount} {likedSongsCount === 1 ? 'song' : 'songs'}
                        </p>
                      </div>
                    </Link>

                    {filteredPlaylists.map((playlist) => (
                      <Link
                        key={playlist.id}
                        href={`/playlists/${playlist.id}`}
                        className="group"
                      >
                        <div className="bg-[#181818] rounded-md p-4 hover:bg-[#282828] transition">
                          <div className="aspect-square rounded bg-[#282828] flex items-center justify-center overflow-hidden mb-4">
                            {playlist.coverUrl ? (
                              <Image
                                src={playlist.coverUrl}
                                alt={playlist.title}
                                width={180}
                                height={180}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-4xl font-bold text-white">{playlist.title[0]}</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-white truncate mb-1">{playlist.title}</p>
                          <p className="text-xs text-white/60 truncate">
                            Playlist • {playlist.trackCount || 0} songs
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!loading && activeTab === "artists" && (
              <div>
                {filteredArtists.length === 0 ? (
                  <div>
                    {viewType === "list" ? (
                      <div className="space-y-2">
                        {/* Liked Songs in Artists tab */}
                        <Link
                          href="/collection/liked"
                          className="flex items-center gap-4 p-2 rounded-md hover:bg-white/5 transition group"
                        >
                          <div className="h-16 w-16 rounded bg-gradient-to-br from-[#5a4bff] via-[#9b5cf6] to-[#e91e63] flex items-center justify-center overflow-hidden shrink-0">
                            <Heart className="h-8 w-8 text-white fill-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-white truncate">Liked Songs</p>
                            <p className="text-sm text-white/60 truncate">
                              Playlist • {likedSongsCount} {likedSongsCount === 1 ? 'song' : 'songs'}
                            </p>
                          </div>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {/* Liked Songs in Artists tab - Grid view */}
                        <Link
                          href="/collection/liked"
                          className="group"
                        >
                          <div className="bg-[#181818] rounded-md p-4 hover:bg-[#282828] transition">
                            <div className="aspect-square rounded bg-gradient-to-br from-[#5a4bff] via-[#9b5cf6] to-[#e91e63] flex items-center justify-center overflow-hidden mb-4">
                              <Heart className="h-16 w-16 text-white fill-white" />
                            </div>
                            <p className="text-sm font-medium text-white truncate mb-1">Liked Songs</p>
                            <p className="text-xs text-white/60 truncate">
                              Playlist • {likedSongsCount} {likedSongsCount === 1 ? 'song' : 'songs'}
                            </p>
                          </div>
                        </Link>
                      </div>
                    )}
                    
                    <div className="text-center py-12">
                      <p className="text-white/60">No followed artists yet</p>
                    </div>
                  </div>
                ) : viewType === "list" ? (
                  <div className="space-y-2">
                    {/* Liked Songs in Artists tab */}
                    <Link
                      href="/collection/liked"
                      className="flex items-center gap-4 p-2 rounded-md hover:bg-white/5 transition group"
                    >
                      <div className="h-16 w-16 rounded bg-gradient-to-br from-[#5a4bff] via-[#9b5cf6] to-[#e91e63] flex items-center justify-center overflow-hidden shrink-0">
                        <Heart className="h-8 w-8 text-white fill-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-white truncate">Liked Songs</p>
                        <p className="text-sm text-white/60 truncate">
                          Playlist • {likedSongsCount} {likedSongsCount === 1 ? 'song' : 'songs'}
                        </p>
                      </div>
                    </Link>

                    {filteredArtists.map((artist) => (
                      <Link
                        key={artist.id}
                        href={`/artists/${artist.slug}`}
                        className="flex items-center gap-4 p-2 rounded-md hover:bg-white/5 transition group"
                      >
                        <div className="h-16 w-16 rounded-full bg-[#282828] flex items-center justify-center overflow-hidden shrink-0">
                          {artist.imageUrl ? (
                            <Image
                              src={artist.imageUrl}
                              alt={artist.name}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl font-bold text-white">{artist.name[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-white truncate">{artist.name}</p>
                          <p className="text-sm text-white/60">Artist</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {/* Liked Songs in Artists tab - Grid view */}
                    <Link
                      href="/collection/liked"
                      className="group"
                    >
                      <div className="bg-[#181818] rounded-md p-4 hover:bg-[#282828] transition">
                        <div className="aspect-square rounded bg-gradient-to-br from-[#5a4bff] via-[#9b5cf6] to-[#e91e63] flex items-center justify-center overflow-hidden mb-4">
                          <Heart className="h-16 w-16 text-white fill-white" />
                        </div>
                        <p className="text-sm font-medium text-white truncate mb-1">Liked Songs</p>
                        <p className="text-xs text-white/60 truncate">
                          Playlist • {likedSongsCount} {likedSongsCount === 1 ? 'song' : 'songs'}
                        </p>
                      </div>
                    </Link>

                    {filteredArtists.map((artist) => (
                      <Link
                        key={artist.id}
                        href={`/artists/${artist.slug}`}
                        className="group"
                      >
                        <div className="bg-[#181818] rounded-md p-4 hover:bg-[#282828] transition">
                          <div className="aspect-square rounded-full bg-[#282828] flex items-center justify-center overflow-hidden mb-4">
                            {artist.imageUrl ? (
                              <Image
                                src={artist.imageUrl}
                                alt={artist.name}
                                width={180}
                                height={180}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-4xl font-bold text-white">{artist.name[0]}</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-white truncate mb-1">{artist.name}</p>
                          <p className="text-xs text-white/60">Artist</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!loading && activeTab === "albums" && (
              <div className="text-center py-12">
                <p className="text-white/60">No {activeTab} yet</p>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Preview Banner - Hidden on mobile */}
      <div className="hidden md:block">
        <PreviewBanner />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Create Playlist Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#1a1a1a] text-white border border-white/10">
          <DialogHeader>
            <DialogTitle>Create playlist</DialogTitle>
            <DialogDescription className="text-white/60">
              Give your playlist a name and optionally add a description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="playlist-title">Title</Label>
              <Input
                id="playlist-title"
                placeholder="My playlist"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#121212] border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playlist-description">Description (optional)</Label>
              <Input
                id="playlist-description"
                placeholder="Add an optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#121212] border-white/10 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-white text-black hover:brightness-95"
            >
              {submitting ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
