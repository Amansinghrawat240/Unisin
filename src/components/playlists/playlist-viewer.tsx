"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Ellipsis,
  UserPlus,
  Pencil,
  Trash2,
  Share2,
  Globe2,
  Lock,
  Music2,
  Play,
  Plus,
  Clock,
  List,
  MoreHorizontal,
  ListPlus,
  ChevronLeft,
  Heart,
  Shuffle,
} from "lucide-react";
import { usePlayer } from "@/lib/hooks/use-player";
import { LikeButton } from "@/components/ui/like-button";

interface PlaylistViewerProps {
  id: string;
}

interface PlaylistData {
  id: number;
  title: string | null;
  description: string | null;
  isPublic: boolean;
  coverUrl?: string | null;
  owner?: { id: string; name?: string | null; image?: string | null } | null;
  tracksCount?: number;
  followerCount?: number;
  isOwner?: boolean;
  tracks?: Array<{
    position: number;
    addedAt: string | null;
    track: {
      id: number;
      title: string;
      durationSec?: number | null;
      imageUrl?: string | null;
      explicit?: boolean | null;
      album?: { id: number; title: string; coverUrl?: string | null } | null;
      artists?: Array<{ id: number; name: string }>;
    };
  }>;
}

// Add cache for user playlists to avoid repeated fetches
const USER_PLAYLISTS_CACHE = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

export default function PlaylistViewer({ id }: PlaylistViewerProps) {
  const router = useRouter();
  const player = usePlayer();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [data, setData] = useState<PlaylistData | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // follow/save state for non-owners
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState<number | undefined>(undefined);

  // Add state for user's playlists for "Add to playlist" feature
  const [userPlaylists, setUserPlaylists] = useState<Array<{ id: number; title: string }>>([]);
  const [loadingUserPlaylists, setLoadingUserPlaylists] = useState(false);

  // Memoize isOwner computation
  const isOwner = useMemo(() => data?.isOwner ?? false, [data?.isOwner]);

  // Memoized user playlists loader with caching
  const loadUserPlaylists = useCallback(async () => {
    if (!session?.user) {
      setUserPlaylists([]);
      return;
    }
    
    if (loadingUserPlaylists) return;
    
    // Check cache first
    const userId = session.user.id;
    const cached = USER_PLAYLISTS_CACHE.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setUserPlaylists(cached.data.filter((p: any) => p.id !== parseInt(id)));
      return;
    }
    
    try {
      setLoadingUserPlaylists(true);
      const res = await fetch("/api/me/library", {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok && json?.own) {
        const playlists = json.own;
        // Update cache
        USER_PLAYLISTS_CACHE.set(userId, { data: playlists, timestamp: Date.now() });
        setUserPlaylists(playlists.filter((p: any) => p.id !== parseInt(id)));
      }
    } catch (e) {
      console.error("Failed to load playlists:", e);
    } finally {
      setLoadingUserPlaylists(false);
    }
  }, [session?.user, loadingUserPlaylists, id]);

  const fetchPlaylist = async () => {
    try {
      const response = await fetch(`/api/playlists/${id}`, {
        credentials: "include",
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || "Failed to load playlist");
      }
      setData(json);
      setEditTitle(json?.title || "");
      setEditDesc(json?.description || "");
      setFollowers(typeof json?.followerCount === "number" ? json.followerCount : undefined);
      setFollowing(json?.isFollowing ?? false);
    } catch (e: any) {
      toast.error(e.message || "Unable to load playlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
    // Load user playlists if authenticated
    if (session?.user && !isPending) {
      loadUserPlaylists();
    }
  }, [id, session, isPending, loadUserPlaylists]);

  const handleSave = async () => {
    if (!data) return;
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/playlists/${data.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editTitle.trim(), description: editDesc.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update");
      toast.success("Playlist updated");
      setEditOpen(false);
      setData((prev) => (prev ? { ...prev, title: json.title, description: json.description } : prev));
    } catch (e: any) {
      toast.error(e.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!data) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/playlists/${data.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete");
      toast.success("Playlist deleted");
      router.push("/");
    } catch (e: any) {
      toast.error(e.message || "Could not delete");
    } finally {
      setDeleting(false);
    }
  };

  const togglePrivacy = async () => {
    if (!data) return;
    try {
      const res = await fetch(`/api/playlists/${data.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublic: !data.isPublic }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update privacy");
      setData((prev) => (prev ? { ...prev, isPublic: json.isPublic } : prev));
      toast.success(json.isPublic ? "Playlist is now public" : "Playlist is now private");
    } catch (e: any) {
      toast.error(e.message || "Could not change privacy");
    }
  };

  const share = async () => {
    try {
      const url = `${window.location.origin}/playlists/${id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleFollow = async () => {
    if (!data) return;
    if (!session?.user) {
      toast.error("Please log in to save playlists");
      return;
    }
    try {
      const response = await fetch(`/api/playlists/${id}/follow`, {
        method: following ? "DELETE" : "POST",
        credentials: "include",
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to update library");
      setFollowing(!following);
      if (typeof json?.followerCount === "number") setFollowers(json.followerCount);
      toast.success(following ? "Removed from Your Library" : "Saved to Your Library");
    } catch (e: any) {
      toast.error(e.message || "Could not update library");
    }
  };

  const playAll = async () => {
    if (!data || !data.tracks || data.tracks.length === 0) return;
    const queue = data.tracks.map((t) => ({
      id: t.track.id,
      title: t.track.title,
      artists: (t.track.artists || []).map((a) => a.name),
      imageUrl: t.track.imageUrl || t.track.album?.coverUrl || "/favicon.ico",
      audioUrl: `/api/playback/stream/${t.track.id}?redirect=1`,
    }));
    player.playTrack(queue[0], true);
    toast.message(`Playing ${queue.length} track${queue.length === 1 ? "" : "s"}`);
  };

  const playTrack = async (trackIndex: number) => {
    if (!data || !data.tracks || data.tracks.length === 0) return;
    const queue = data.tracks.map((t) => ({
      id: t.track.id,
      title: t.track.title,
      artists: (t.track.artists || []).map((a) => a.name),
      imageUrl: t.track.imageUrl || t.track.album?.coverUrl || "/favicon.ico",
      audioUrl: `/api/playback/stream/${t.track.id}?redirect=1`,
    }));
    player.playFromQueue(queue, trackIndex);
  };

  const addToQueue = (trackData: any) => {
    const queueItem = {
      id: trackData.id,
      title: trackData.title,
      artists: (trackData.artists || []).map((a: any) => a.name),
      imageUrl: trackData.imageUrl || trackData.album?.coverUrl || "/favicon.ico",
      audioUrl: `/api/playback/stream/${trackData.id}?redirect=1`,
    };
    player.addToQueue(queueItem);
    toast.success(`Added "${trackData.title}" to queue`);
  };

  const shareTrack = async (trackData: any) => {
    try {
      const url = `${window.location.origin}/track/${trackData.id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Track link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleRemoveTrack = async (trackId: number) => {
    if (!data) return;
    try {
      const response = await fetch(`/api/playlists/${id}/tracks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ track_id: trackId }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to remove track");
      toast.success("Track removed from playlist");
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tracks: prev.tracks?.filter((t) => t.track.id !== trackId),
        };
      });
    } catch (e: any) {
      toast.error(e.message || "Could not remove track");
    }
  };

  const addToPlaylist = async (playlistId: number, trackId: number, trackTitle: string) => {
    if (!session?.user) {
      toast.error("Please log in to add tracks to playlists");
      return;
    }
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to add track");
      toast.success(`Added "${trackTitle}" to playlist`);
      
      // If we're currently viewing the playlist we just added to, refetch it
      if (data && data.id === playlistId) {
        await fetchPlaylist();
      }
    } catch (e: any) {
      toast.error(e.message || "Could not add to playlist");
    }
  };

  // Memoize total duration calculation
  const { totalDuration, durationText } = useMemo(() => {
    const total = data?.tracks?.reduce((acc, t) => acc + (t.track.durationSec || 0), 0) || 0;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const text = hours > 0 ? `about ${hours} hr ${minutes} min` : `${minutes} min`;
    return { totalDuration: total, durationText: text };
  }, [data?.tracks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">Loading playlist…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-destructive-foreground">Playlist not found.</p>
      </div>
    );
  }

  // Check if owner is UniSin system user
  const isUnisInPlaylist = data.owner?.id === 'unisin-system';
  const ownerDisplayName = isUnisInPlaylist ? 'UniSin' : (data.owner?.name || "Unknown");
  const ownerSlug = isUnisInPlaylist ? 'unisin' : null;

  return (
    <div className="space-y-0">
      {/* Mobile Back Button - Only visible on mobile */}
      <div className="md:hidden absolute top-4 left-4 z-10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Hero header - Mobile-optimized centered layout */}
      <section className="relative bg-gradient-to-b from-[#8b2f47] via-[#5d1f31] to-transparent pb-6 pt-16 md:pt-20 px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-6">
          {/* Cover - Centered and larger on mobile */}
          <div className="h-56 w-56 md:h-56 md:w-56 shrink-0 rounded overflow-hidden bg-[#282828] flex items-center justify-center shadow-2xl">
            {data.coverUrl ? (
              <img src={data.coverUrl} alt="Playlist cover" className="h-full w-full object-cover" />
            ) : (
              <Music2 className="h-16 w-16 text-muted-foreground" />
            )}
          </div>

          {/* Title/meta - Centered on mobile, left-aligned on desktop */}
          <div className="flex-1 pb-2 md:pb-6 text-center md:text-left w-full">
            <p className="text-xs md:text-sm font-bold mb-2 md:mb-2 uppercase tracking-wide">
              {data.isPublic ? "Public Playlist" : "Private Playlist"}
            </p>
            <h1 className="text-4xl md:text-8xl font-black mb-4 md:mb-6 leading-tight md:leading-none">
              {data.title || "Untitled playlist"}
            </h1>
            {data.description && (
              <p className="text-sm md:text-sm text-white/90 mb-3 md:mb-4 line-clamp-2">{data.description}</p>
            )}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1 md:gap-2 text-sm md:text-sm">
              {ownerSlug ? (
                <Link 
                  href={`/artists/${ownerSlug}`}
                  className="font-bold hover:underline"
                >
                  {ownerDisplayName}
                </Link>
              ) : (
                <span className="font-bold">{ownerDisplayName}</span>
              )}
              {typeof followers === "number" && followers > 0 && (
                <>
                  <span>•</span>
                  <span>{followers.toLocaleString()} saves</span>
                </>
              )}
              {typeof data.tracksCount === "number" && (
                <>
                  <span>•</span>
                  <span>{data.tracksCount} songs</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Controls - Mobile-optimized with larger touch targets */}
      <section className="bg-gradient-to-b from-[#1a1a1a]/95 to-[#121212] px-4 md:px-6 py-6 md:py-6">
        <div className="flex items-center justify-between md:justify-start gap-4">
          {/* Mobile: Large centered play button */}
          <div className="flex items-center gap-6 md:gap-8">
            <Button
              onClick={playAll}
              disabled={!data.tracks || data.tracks.length === 0}
              className="h-14 w-14 md:h-14 md:w-14 rounded-full bg-[#1db954] hover:scale-105 hover:bg-[#1ed760] text-black flex items-center justify-center shadow-lg transition active:scale-95"
              title="Play"
            >
              <Play className="h-6 w-6 md:h-6 md:w-6 pl-0.5 fill-current" />
            </Button>

            {/* Mobile: Show shuffle button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 md:hidden text-zinc-400 hover:text-white hover:bg-transparent transition"
              title="Shuffle"
            >
              <Shuffle className="h-7 w-7" />
            </Button>

            {!isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFollow}
                className="h-10 w-10 text-zinc-400 hover:text-white hover:bg-transparent transition active:scale-95"
                title={following ? "Remove from Your Library" : "Save to Your Library"}
              >
                <Heart className={`h-7 w-7 ${following ? "fill-[#1db954] text-[#1db954]" : ""}`} />
              </Button>
            )}

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 text-zinc-400 hover:text-white hover:bg-transparent active:scale-95" 
                    title="More options"
                  >
                    <MoreHorizontal className="h-7 w-7" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 bg-[#282828] text-white border-none shadow-xl">
                  <DropdownMenuItem onClick={() => setEditOpen(true)} className="focus:bg-white/10">
                    <Pencil className="h-4 w-4 mr-2" /> Edit details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={togglePrivacy} className="focus:bg-white/10">
                    {data.isPublic ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" /> Make private
                      </>
                    ) : (
                      <>
                        <Globe2 className="h-4 w-4 mr-2" /> Make public
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="focus:bg-white/10 text-red-400">
                    <Trash2 className="h-4 w-4 mr-2" /> {deleting ? "Deleting…" : "Delete"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={share} className="focus:bg-white/10">
                    <Share2 className="h-4 w-4 mr-2" /> Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Button variant="ghost" size="sm" className="hidden md:flex text-zinc-400 hover:text-white hover:bg-transparent">
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
        </div>
      </section>

      {/* Track listing - Optimized mobile card layout */}
      <section className="bg-gradient-to-b from-[#121212] to-[#121212] px-0 md:px-6 pb-6">
        {data.tracks && data.tracks.length > 0 ? (
          <div className="mt-0 md:mt-4">
            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden md:block">
              {/* Table header */}
              <div className="grid grid-cols-[16px_6fr_4fr_3fr_80px_40px] gap-4 px-4 py-2 text-sm text-zinc-400 border-b border-white/10 mb-2">
                <div className="text-center">#</div>
                <div>Title</div>
                <div>Album</div>
                <div>Date added</div>
                <div className="flex justify-end">
                  <Clock className="h-4 w-4" />
                </div>
                <div></div>
              </div>

              {/* Track rows */}
              <div className="space-y-1">
                {data.tracks.map((t, index) => (
                  <div
                    key={t.track.id}
                    className="grid grid-cols-[16px_6fr_4fr_3fr_80px_40px] gap-4 px-4 py-2 rounded group hover:bg-white/10 transition"
                  >
                    {/* Track number */}
                    <div 
                      onClick={() => playTrack(index)}
                      className="text-zinc-400 text-center text-sm flex items-center justify-center cursor-pointer"
                    >
                      {index + 1}
                    </div>

                    {/* Title & Artist with thumbnail */}
                    <div className="flex items-center gap-3 min-w-0">
                      {t.track.imageUrl || t.track.album?.coverUrl ? (
                        <img
                          src={t.track.imageUrl || t.track.album?.coverUrl || ""}
                          alt={t.track.title}
                          className="h-10 w-10 rounded object-cover shrink-0 cursor-pointer"
                          onClick={() => playTrack(index)}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-[#282828] flex items-center justify-center shrink-0 cursor-pointer" onClick={() => playTrack(index)}>
                          <Music2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-normal truncate cursor-pointer" onClick={() => playTrack(index)}>{t.track.title}</div>
                        <div className="text-sm text-zinc-400 truncate">
                          {t.track.artists && t.track.artists.length > 0 ? (
                            t.track.artists.map((artist, idx) => (
                              <span key={artist.id}>
                                <Link
                                  href={`/artists/${encodeURIComponent(artist.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''))}`}
                                  className="hover:underline hover:text-white transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {artist.name}
                                </Link>
                                {idx < t.track.artists!.length - 1 && ", "}
                              </span>
                            ))
                          ) : (
                            "Unknown artist"
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Album */}
                    <div 
                      onClick={() => playTrack(index)}
                      className="flex items-center text-sm text-zinc-400 truncate cursor-pointer"
                    >
                      {t.track.album?.title || t.track.title}
                    </div>

                    {/* Date added */}
                    <div 
                      onClick={() => playTrack(index)}
                      className="flex items-center text-sm text-zinc-400 cursor-pointer"
                    >
                      {t.addedAt
                        ? new Date(t.addedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Unknown"}
                    </div>

                    {/* Duration */}
                    <div 
                      onClick={() => playTrack(index)}
                      className="flex items-center justify-end text-sm text-zinc-400 cursor-pointer"
                    >
                      {t.track.durationSec
                        ? `${Math.floor(t.track.durationSec / 60)}:${String(t.track.durationSec % 60).padStart(2, "0")}`
                        : "--:--"}
                    </div>

                    {/* Actions menu */}
                    <div className="flex items-center justify-center gap-2">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <LikeButton trackId={t.track.id} size="sm" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-[#282828] text-white border-none shadow-xl">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger 
                              className="focus:bg-white/10"
                              onPointerEnter={() => {
                                if (session?.user && !loadingUserPlaylists) {
                                  loadUserPlaylists();
                                }
                              }}
                              onClick={() => {
                                if (session?.user && !loadingUserPlaylists) {
                                  loadUserPlaylists();
                                }
                              }}
                            >
                              <ListPlus className="h-4 w-4 mr-2" />
                              Add to playlist
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-[#282828] text-white border-none shadow-xl">
                              {loadingUserPlaylists || isPending ? (
                                <DropdownMenuItem disabled className="text-zinc-500">
                                  Loading…
                                </DropdownMenuItem>
                              ) : !session?.user ? (
                                <DropdownMenuItem disabled className="text-zinc-500">
                                  Log in to see your playlists
                                </DropdownMenuItem>
                              ) : userPlaylists.length > 0 ? (
                                userPlaylists.map((playlist) => (
                                  <DropdownMenuItem
                                    key={playlist.id}
                                    onClick={() => addToPlaylist(playlist.id, t.track.id, t.track.title)}
                                    className="focus:bg-white/10"
                                  >
                                    {playlist.title}
                                  </DropdownMenuItem>
                                ))
                              ) : (
                                <DropdownMenuItem disabled className="text-zinc-500">
                                  No playlists available
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuItem
                            onClick={() => addToQueue(t.track)}
                            className="focus:bg-white/10"
                          >
                            <List className="h-4 w-4 mr-2" />
                            Add to queue
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => shareTrack(t.track)}
                            className="focus:bg-white/10"
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Card Layout - Larger touch targets */}
            <div className="block md:hidden">
              {data.tracks.map((t, index) => (
                <div
                  key={t.track.id}
                  className="flex items-center gap-3 px-4 py-3 active:bg-white/5 transition-colors min-h-[72px]"
                >
                  {/* Album artwork - Larger */}
                  <div 
                    onClick={() => playTrack(index)}
                    className="shrink-0"
                  >
                    {t.track.imageUrl || t.track.album?.coverUrl ? (
                      <img
                        src={t.track.imageUrl || t.track.album?.coverUrl || ""}
                        alt={t.track.title}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-[#282828] flex items-center justify-center">
                        <Music2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Track info - Better spacing */}
                  <div 
                    className="flex-1 min-w-0"
                    onClick={() => playTrack(index)}
                  >
                    <div className="text-white font-medium truncate text-base">
                      {t.track.title}
                    </div>
                    <div className="text-sm text-zinc-400 truncate mt-0.5">
                      {t.track.artists && t.track.artists.length > 0 ? (
                        t.track.artists.map((artist, idx) => (
                          <span key={artist.id}>
                            <Link
                              href={`/artists/${encodeURIComponent(artist.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''))}`}
                              className="hover:underline hover:text-white transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {artist.name}
                            </Link>
                            {idx < t.track.artists!.length - 1 && ", "}
                          </span>
                        ))
                      ) : (
                        "Unknown artist"
                      )}
                    </div>
                  </div>

                  {/* Actions menu - Larger touch target */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-zinc-400 hover:text-white shrink-0 active:scale-95"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-6 w-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#282828] text-white border-none shadow-xl">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger 
                          className="focus:bg-white/10"
                          onPointerEnter={() => {
                            if (session?.user && !loadingUserPlaylists) {
                              loadUserPlaylists();
                            }
                          }}
                          onClick={() => {
                            if (session?.user && !loadingUserPlaylists) {
                              loadUserPlaylists();
                            }
                          }}
                        >
                          <ListPlus className="h-4 w-4 mr-2" />
                          Add to playlist
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="bg-[#282828] text-white border-none shadow-xl">
                          {loadingUserPlaylists || isPending ? (
                            <DropdownMenuItem disabled className="text-zinc-500">
                              Loading…
                            </DropdownMenuItem>
                          ) : !session?.user ? (
                            <DropdownMenuItem disabled className="text-zinc-500">
                              Log in to see your playlists
                            </DropdownMenuItem>
                          ) : userPlaylists.length > 0 ? (
                            userPlaylists.map((playlist) => (
                              <DropdownMenuItem
                                key={playlist.id}
                                onClick={() => addToPlaylist(playlist.id, t.track.id, t.track.title)}
                                className="focus:bg-white/10"
                              >
                                {playlist.title}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <DropdownMenuItem disabled className="text-zinc-500">
                              No playlists available
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(t.track);
                        }}
                        className="focus:bg-white/10"
                      >
                        <List className="h-4 w-4 mr-2" />
                        Add to queue
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          shareTrack(t.track);
                        }}
                        className="focus:bg-white/10"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 text-center">
            <p className="text-lg font-bold mb-2">Let&apos;s find something for your playlist</p>
            <div className="mt-4 max-w-md mx-auto">
              <div className="bg-[#2a2a2a] rounded-md h-10 flex items-center px-3 text-sm text-zinc-400">
                <span>Search for songs or episodes</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Edit Details Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#282828] border-none text-white">
          <DialogHeader>
            <DialogTitle>Edit details</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-[160px_1fr] gap-4 items-start mt-2">
            {/* Cover preview */}
            <div className="h-40 w-40 rounded-md bg-[#181818] border border-white/10 flex items-center justify-center">
              {data?.coverUrl ? (
                <img src={data.coverUrl} alt="Cover" className="h-full w-full object-cover rounded-md" />
              ) : (
                <Music2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Name</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Add a name"
                  className="bg-[#3e3e3e] border-none text-white"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Description</label>
                <Textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Add an optional description"
                  rows={4}
                  className="bg-[#3e3e3e] border-none text-white resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-white text-black hover:bg-white/90 rounded-full px-8 font-bold"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}