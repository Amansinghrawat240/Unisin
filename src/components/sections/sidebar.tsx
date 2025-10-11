"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Mic, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";

type TabType = "playlists" | "artists";

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

export default function Sidebar() {
  const { data: session, isPending } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("playlists");
  const [width, setWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [followedArtists, setFollowedArtists] = useState<Artist[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem("sidebar_width");
    if (savedWidth) {
      setWidth(parseInt(savedWidth, 10));
    }
  }, []);

  // Handle resize drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const minWidth = 200;
      const maxWidth = 500;
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      setWidth(newWidth);
      localStorage.setItem("sidebar_width", newWidth.toString());
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const fetchLibrary = async () => {
    // Only fetch if user is authenticated
    if (!session?.user) {
      setPlaylists([]);
      setFollowedArtists([]);
      setLoadingLibrary(false);
      return;
    }

    try {
      const response = await fetch("/api/me/library", {
        credentials: "include",
      });
      
      // Handle 401 gracefully
      if (response.status === 401) {
        setPlaylists([]);
        setFollowedArtists([]);
        setLoadingLibrary(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to load library");
      }
      const data = await response.json();
      setPlaylists([...(data.own || []), ...(data.followed || [])]);
      setFollowedArtists(data.followedArtists || []);
    } catch (error) {
      console.error("Load library error:", error);
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    // Only fetch library when session is loaded
    if (!isPending) {
      fetchLibrary();
    }
  }, [session?.user, isPending]);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a playlist title");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/playlists", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
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
      fetchLibrary();
    } catch (error: any) {
      toast.error(error.message || "Failed to create playlist");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside 
      ref={sidebarRef}
      className="h-full bg-black border-r border-white/10 flex flex-col relative"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-white/20 transition-colors z-50 ${
          isResizing ? "bg-white/30" : ""
        }`}
        title="Drag to resize"
      />

      {/* Header with tabs */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <Link href="/library" className="hover:text-white/80 transition">
            <h2 className="text-base font-semibold text-white">Your Library</h2>
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition"
            title="Create playlist"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        
        {/* Creator Button */}
        <Link 
          href="/creator"
          className="flex items-center gap-2 w-full mb-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:brightness-110 transition"
        >
          <Mic className="h-4 w-4 text-white" />
          <span className="text-sm font-semibold text-white">Creator</span>
        </Link>
        
        {/* Tab buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("playlists")}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-full transition ${
              activeTab === "playlists"
                ? "bg-white text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setActiveTab("artists")}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-full transition ${
              activeTab === "artists"
                ? "bg-white text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            Artists
          </button>
        </div>
      </div>

      {/* Playlists Tab */}
      {activeTab === "playlists" && (
        <div className="flex-grow overflow-y-auto scrollbar-unisin px-2 pt-2 pb-4">
          {/* Liked Songs - Always visible */}
          <Link 
            href="/collection/liked" 
            className="group flex items-center gap-3 rounded-md px-2 py-2 mb-1 hover:bg-white/5 transition-colors"
          >
            <div className="h-12 w-12 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
              <Heart className="h-6 w-6 text-white fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate text-white">Liked Songs</p>
              <p className="text-xs text-white/60 truncate">Playlist</p>
            </div>
          </Link>

          {loadingLibrary && (
            <p className="px-2 py-2 text-sm text-muted-foreground">Loading your playlists…</p>
          )}
          {!loadingLibrary && playlists.length > 0 && (
            <ul className="mb-3 space-y-1">
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  <Link href={`/playlists/${playlist.id}`} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-white/5 transition-colors">
                    <div className="h-12 w-12 rounded bg-[#282828] flex items-center justify-center overflow-hidden shrink-0">
                      {playlist.coverUrl ? (
                        <Image
                          src={playlist.coverUrl}
                          alt={playlist.title}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-white">{playlist.title[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-white">{playlist.title}</p>
                      <p className="text-xs text-white/60 truncate">
                        Playlist · {playlist.trackCount || 0} songs
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!loadingLibrary && playlists.length === 0 && (
            <div className="px-2 py-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">No playlists yet</p>
              <p className="text-xs text-muted-foreground">
                Create a playlist to get started
              </p>
            </div>
          )}
        </div>
      )}

      {/* Artists Tab */}
      {activeTab === "artists" && (
        <div className="flex-grow overflow-y-auto scrollbar-unisin px-2 pt-2 pb-4">
          {loadingLibrary && (
            <p className="px-2 py-2 text-sm text-muted-foreground">Loading your artists…</p>
          )}
          {!loadingLibrary && followedArtists.length > 0 && (
            <ul className="mb-3 space-y-1">
              {followedArtists.map((artist) => (
                <li key={artist.id}>
                  <Link href={`/artists/${artist.slug}`} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-white/5 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-[#282828] flex items-center justify-center overflow-hidden shrink-0">
                      {artist.imageUrl ? (
                        <Image
                          src={artist.imageUrl}
                          alt={artist.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-white">{artist.name[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-white">{artist.name}</p>
                      <p className="text-xs text-white/60 truncate">Artist</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!loadingLibrary && followedArtists.length === 0 && (
            <div className="px-2 py-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">No followed artists yet</p>
              <p className="text-xs text-muted-foreground">
                Follow artists to see them here
              </p>
            </div>
          )}
        </div>
      )}

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
    </aside>
  );
}
