"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Upload, Globe, ShieldCheck, RefreshCw, FileText, Music2, ListMusic, Search, X, Upload as UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";

type CreatorStatus = "none" | "pending" | "approved" | "suspended";

// Normalize backend status strings (handles common typos like "aprrov")
const normalizeStatus = (s: string | undefined | null): CreatorStatus => {
  const v = String(s || "none").toLowerCase().trim();
  const map: Record<string, CreatorStatus> = {
    none: "none",
    pending: "pending",
    approved: "approved",
    approv: "approved",
    aprrov: "approved",
    approval: "approved",
    suspend: "suspended",
    suspended: "suspended",
  };
  return map[v] ?? "none";
};

type SubmissionItem = {
  trackId: number;
  title: string;
  state: "draft" | "submitted" | "processing" | "needs_review" | "rejected" | "live";
  createdAt: number;
  lastUpdate: number;
  notes?: string;
};

type Playlist = {
  id: number;
  title: string;
  description?: string;
  coverUrl?: string;
  tracksCount?: number;
};

type SearchTrack = {
  id: number;
  title: string;
  artistName: string;
  imageUrl?: string;
  duration?: number;
};

// Build fresh headers with credentials included
const getAuthHeaders = (): HeadersInit => {
  return { "Content-Type": "application/json" };
};

// Visual label helpers for submission states
const stateBadge = (s: SubmissionItem["state"]) => {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";
  switch (s) {
    case "live":
      return <span className={`${base} bg-emerald-500/15 text-emerald-300 border border-emerald-500/30`}>Approved • Live</span>;
    case "rejected":
      return <span className={`${base} bg-rose-500/15 text-rose-300 border border-rose-500/30`}>Rejected</span>;
    case "needs_review":
      return <span className={`${base} bg-yellow-500/15 text-yellow-300 border border-yellow-500/30`}>Needs review</span>;
    case "processing":
      return <span className={`${base} bg-blue-500/15 text-blue-300 border border-blue-500/30`}>Processing</span>;
    case "submitted":
      return <span className={`${base} bg-zinc-500/15 text-zinc-300 border border-zinc-500/30`}>Submitted</span>;
    default:
      return <span className={`${base} bg-zinc-700/30 text-zinc-300 border border-zinc-600/50`}>Draft</span>;
  }
};

export default function CreatorDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading } = useSession();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<CreatorStatus>("none");
  const [statusNotes, setStatusNotes] = useState<string | undefined>();

  const [tracks, setTracks] = useState<SubmissionItem[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);

  // Playlist states
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);

  // Music search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [browseTracksOpen, setBrowseTracksOpen] = useState(false);

  const [applyOpen, setApplyOpen] = useState(false);
  const [applySubmitting, setApplySubmitting] = useState(false);

  // Apply form fields
  const [displayName, setDisplayName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [terms, setTerms] = useState(false);

  // Submit track form fields
  const [title, setTitle] = useState("");
  const [artists, setArtists] = useState(""); // CSV
  const [artistName, setArtistName] = useState(""); // Optional artist name
  const [album, setAlbum] = useState("");
  const [releaseDate, setReleaseDate] = useState(""); // YYYY-MM-DD
  const [genre, setGenre] = useState("");
  const [explicit, setExplicit] = useState(false);
  // replace optional URL with required file
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [sourceType, setSourceType] = useState<"external" | "upload">("external");
  const [originalUrl, setOriginalUrl] = useState("");
  const [submittingTrack, setSubmittingTrack] = useState(false);

  // NEW: Audio file upload states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [audioUploading, setAudioUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [fetchingDuration, setFetchingDuration] = useState(false);

  // Prefill title from query (?title=... or ?q=...)
  useEffect(() => {
    const qp = (searchParams.get("title") || searchParams.get("q") || "").trim();
    if (qp && !title) {
      setTitle(qp);
    }
  }, [searchParams, title]);

  const loadStatus = useCallback(async () => {
    if (!session?.user) {
      setStatus("none");
      setStatusNotes(undefined);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/v1/me/creator/status", { 
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (res.status === 401) {
        setStatus("none");
        setStatusNotes(undefined);
      } else {
        const data = await res.json();
        if (res.ok) {
          setStatus(normalizeStatus(data.status));
          setStatusNotes(data.notes);
        } else {
          toast.error(data?.error || "Failed to load creator status");
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load creator status");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!sessionLoading) {
      loadStatus();
    }
  }, [sessionLoading, loadStatus]);

  // Prefill artist with logged-in username
  useEffect(() => {
    // Use Better Auth session data instead of localStorage
    if (session?.user && status === "approved" && !artists) {
      const username = session.user.name || session.user.email?.split('@')[0] || '';
      if (username) {
        setArtists(String(username));
      }
    }
  }, [session, status]);

  const loadTracks = async () => {
    try {
      setTracksLoading(true);
      const res = await fetch("/api/v1/me/tracks", { 
        headers: getAuthHeaders(),
        credentials: "include"
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.error || "Failed to load submissions");
      setTracks(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load submissions");
    } finally {
      setTracksLoading(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      setPlaylistsLoading(true);
      const res = await fetch("/api/me/library", { 
        headers: getAuthHeaders(),
        credentials: "include"
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data?.own)) {
        setPlaylists(data.own);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load playlists");
    } finally {
      setPlaylistsLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "none" && session?.user) {
      loadTracks();
      loadPlaylists();
    }
  }, [status, session]);

  const handleSearchTracks = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&type=tracks`, {
        headers: getAuthHeaders(),
        credentials: "include"
      });
      
      const data = await res.json().catch(() => ({ tracks: [] }));
      if (res.ok && Array.isArray(data?.tracks)) {
        setSearchResults(data.tracks);
      } else {
        setSearchResults([]);
      }
    } catch (e: any) {
      toast.error(e.message || "Search failed");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim()) {
      toast.error("Please enter a playlist title");
      return;
    }
    
    setCreatingPlaylist(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          title: newPlaylistTitle.trim(),
          description: newPlaylistDesc.trim() || undefined,
          isPublic: true
        })
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create playlist");
      
      toast.success("Playlist created successfully");
      setCreatePlaylistOpen(false);
      setNewPlaylistTitle("");
      setNewPlaylistDesc("");
      await loadPlaylists();
    } catch (e: any) {
      toast.error(e.message || "Failed to create playlist");
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: number) => {
    if (!selectedTrackId) return;
    
    setAddingToPlaylist(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ trackId: selectedTrackId })
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.code === "TRACK_ALREADY_EXISTS") {
          toast.error("This track is already in the playlist");
        } else {
          throw new Error(data?.error || "Failed to add track");
        }
      } else {
        toast.success("Track added to playlist");
        setAddToPlaylistOpen(false);
        setBrowseTracksOpen(false);
        setSelectedTrackId(null);
        setSearchQuery("");
        setSearchResults([]);
        await loadPlaylists();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to add track");
    } finally {
      setAddingToPlaylist(false);
    }
  };

  const handleApply = async () => {
    try {
      // Check if user is authenticated using Better-Auth session
      if (!session?.user) {
        toast.message("Please log in to apply as a creator");
        router.push(`/login?redirect=${encodeURIComponent("/creator")}`);
        return;
      }

      if (!displayName.trim() || !email.trim() || !country.trim() || !terms) {
        toast.error("Please complete all required fields and accept terms");
        return;
      }
      setApplySubmitting(true);
      const res = await fetch("/api/v1/me/creator/apply", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: instagram.trim() || undefined,
          email: email.trim(),
          country: country.trim(),
          termsAccepted: true,
        }),
      });

      if (res.status === 401) {
        toast.error("Please log in to apply.");
        router.push(`/login?redirect=${encodeURIComponent("/creator")}`);
        setApplySubmitting(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Application failed");
      toast.success("Application submitted. You will be notified when approved.");
      setApplyOpen(false);
      setStatus("pending");
    } catch (e: any) {
      toast.error(e.message || "Application failed");
    } finally {
      setApplySubmitting(false);
    }
  };

  // NEW: Function to fetch audio duration from URL or File
  const fetchAudioDuration = async (source: string | File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      const handleLoadedMetadata = () => {
        const duration = Math.floor(audio.duration);
        cleanup();
        resolve(duration);
      };
      
      const handleError = () => {
        cleanup();
        reject(new Error("Failed to load audio metadata"));
      };
      
      const cleanup = () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
        audio.src = '';
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);
      
      if (typeof source === 'string') {
        audio.src = source;
      } else {
        audio.src = URL.createObjectURL(source);
      }
      
      audio.load();
    });
  };

  // NEW: Auto-fetch duration when audio URL changes
  useEffect(() => {
    const fetchDuration = async () => {
      if (originalUrl && originalUrl.trim() && !audioFile) {
        setFetchingDuration(true);
        try {
          const duration = await fetchAudioDuration(originalUrl);
          setAudioDuration(duration);
          toast.success(`Duration detected: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);
        } catch (error) {
          console.error("Failed to fetch audio duration:", error);
          setAudioDuration(null);
        } finally {
          setFetchingDuration(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchDuration, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [originalUrl, audioFile]);

  // NEW: Handle audio file upload to Dropbox
  const handleAudioFileUpload = async (file: File) => {
    const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a'];
    const validExtensions = ['.mp3', '.m4a'];
    const isValidType = validAudioTypes.some(type => file.type.includes(type));
    const isValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType && !isValidExtension) {
      toast.error('Please select a valid MP3 or M4A audio file');
      return;
    }

    // Extract duration from audio file first
    setFetchingDuration(true);
    try {
      const duration = await fetchAudioDuration(file);
      setAudioDuration(duration);
      toast.success(`Duration detected: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);
    } catch (error) {
      console.error("Failed to extract audio duration:", error);
      toast.error("Could not extract audio duration");
    } finally {
      setFetchingDuration(false);
    }

    setAudioUploading(true);
    setAudioUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setAudioUploadProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setOriginalUrl(response.url);
          toast.success('Audio file uploaded successfully to Dropbox');
          setAudioUploadProgress(100);
        } else {
          const error = JSON.parse(xhr.responseText);
          toast.error(error.message || 'Upload failed');
          setAudioFile(null);
          setAudioUploadProgress(0);
        }
        setAudioUploading(false);
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        toast.error('Network error during upload');
        setAudioUploading(false);
        setAudioFile(null);
        setAudioUploadProgress(0);
      });

      xhr.open('POST', '/api/upload-to-dropbox');
      xhr.send(formData);
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
      setAudioUploading(false);
      setAudioFile(null);
      setAudioUploadProgress(0);
    }
  };

  // NEW: Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      setAudioFile(file);
      handleAudioFileUpload(file);
    }
  };

  const handleSubmitTrack = async () => {
    try {
      // Ensure user is logged in using Better-Auth session
      if (!session?.user) {
        toast.message("Please log in to submit a track");
        router.push(`/login?redirect=${encodeURIComponent("/creator")}`);
        return;
      }

      if (!title.trim()) return toast.error("Title is required");
      const parsedArtists = artists
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      if (parsedArtists.length === 0) return toast.error("At least one artist is required");
      if (sourceType === "external" && !originalUrl.trim()) {
        return toast.error("Provide a direct public audio URL or upload an MP3 file");
      }
      if (!coverFile) {
        return toast.error("Cover image is required");
      }

      setSubmittingTrack(true);

      // Upload cover image file first
      const fd = new FormData();
      fd.append("file", coverFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      let uploadData: any = {};
      try {
        uploadData = await uploadRes.json();
      } catch {}
      if (!uploadRes.ok || !uploadData?.url) {
        const msg = (uploadData && (uploadData.error || uploadData.message)) || `Cover upload failed (${uploadRes.status})`;
        throw new Error(msg);
      }

      const body: any = {
        title: title.trim(),
        artists: parsedArtists,
        artistName: artistName.trim() || undefined,
        album: album.trim() || undefined,
        releaseDate: releaseDate ? Math.floor(new Date(releaseDate).getTime() / 1000) : undefined,
        genre: genre.trim() || undefined,
        explicit,
        cover_url: String(uploadData.url),
        source: sourceType === "external"
          ? { type: "external", original_url: originalUrl.trim() }
          : { type: "upload" },
      };

      const res = await fetch("/api/v1/me/tracks", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(body),
      });

      // Prefer server-provided error message
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // noop
      }

      if (res.status === 401) {
        toast.error("Please log in to submit tracks");
        router.push(`/login?redirect=${encodeURIComponent("/creator")}`);
        setSubmittingTrack(false);
        return;
      }
      if (res.status === 403) {
        toast.error(data?.error || "You must be an approved creator to submit tracks");
        setSubmittingTrack(false);
        return;
      }
      if (!res.ok) {
        const fallbackText = data?.error || data?.message || `Submit failed (${res.status})`;
        throw new Error(fallbackText);
      }

      toast.success("Track submitted. Processing may take a few minutes — you'll be notified when it's live.");
      // Reset all fields
      setTitle("");
      setArtists("");
      setArtistName("");
      setAlbum("");
      setReleaseDate("");
      setGenre("");
      setExplicit(false);
      setCoverFile(null);
      setCoverPreview("");
      setOriginalUrl("");
      setAudioFile(null);
      setAudioUploadProgress(0);
      await loadTracks();
    } catch (e: any) {
      toast.error(e.message || "Submit failed");
    } finally {
      setSubmittingTrack(false);
    }
  };

  const retryFetch = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/me/tracks/${id}/retry-fetch`, { 
        method: "POST", 
        headers: getAuthHeaders(),
        credentials: "include"
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Retry failed");
      toast.success("Retry requested");
      await loadTracks();
    } catch (e: any) {
      toast.error(e.message || "Retry failed");
    }
  };

  const submitForReview = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/me/tracks/${id}/submit-for-review`, { 
        method: "POST", 
        headers: getAuthHeaders(),
        credentials: "include"
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Action failed");
      toast.success("Submitted for manual review");
      await loadTracks();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    }
  };

  // Filter only live tracks for adding to playlists
  const liveTracksForPlaylist = useMemo(() => 
    tracks.filter(t => t.state === "live"),
    [tracks]
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Creator Dashboard</h1>
          <p className="text-md mt-1 text-muted-foreground">Submit tracks and manage your creator application</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full border ${status === "approved" ? "border-green-500 text-green-400" : status === "pending" ? "border-yellow-500 text-yellow-400" : status === "suspended" ? "border-pink-500 text-pink-400" : "border-muted-foreground/50 text-muted-foreground"}`}>{status.toUpperCase()}</span>
          {(loading || sessionLoading) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* Application CTA / Banner */}
      {status === "none" && (
        <div className="rounded-lg border border-border bg-background-secondary p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Become a Creator</p>
              <p className="text-sm text-muted-foreground mt-1">Apply to publish your music on Unisin.</p>
            </div>
            <Button onClick={() => {
              if (!session?.user) {
                toast.message("Please log in to apply as a creator");
                router.push(`/login?redirect=${encodeURIComponent("/creator")}`);
                return;
              }
              setApplyOpen(true);
            }} className="bg-[#1db954] hover:bg-[#18a84d]">Apply</Button>
          </div>
        </div>
      )}

      {status === "pending" && (
        <div className="rounded-lg border border-border bg-background-secondary p-4 mb-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="font-semibold">Application pending</p>
              <p className="text-sm text-muted-foreground">We'll email you once your account is approved.</p>
              {statusNotes && <p className="text-xs text-muted-foreground mt-1">Notes: {statusNotes}</p>}
            </div>
          </div>
        </div>
      )}

      {status === "approved" && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 mb-6">
          <p className="font-semibold text-emerald-300">You are approved as a Creator</p>
          <p className="text-xs text-emerald-200 mt-1">You can submit tracks below. We'll show clear status when your tracks are approved or rejected.</p>
        </div>
      )}

      {status === "suspended" && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 mb-6">
          <p className="font-semibold text-rose-300">Account suspended</p>
          <p className="text-xs text-rose-200 mt-1">{statusNotes ? `Reason: ${statusNotes}` : "Please contact support for details."}</p>
        </div>
      )}

      {/* NEW: Playlists Section with Browse Music */}
      {status === "approved" && (
        <div className="rounded-lg border border-border bg-background-secondary p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ListMusic className="h-5 w-5" /> Your Playlists
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setBrowseTracksOpen(true)}
                size="sm"
                variant="outline"
                className="border-border/60"
              >
                <Search className="h-4 w-4 mr-2" />
                Browse Music
              </Button>
              <Button
                onClick={() => setCreatePlaylistOpen(true)}
                size="sm"
                className="bg-[#1db954] hover:bg-[#18a84d]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Playlist
              </Button>
            </div>
          </div>

          {playlistsLoading ? (
            <div className="py-6 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading playlists…
            </div>
          ) : playlists.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No playlists yet. Create your first playlist to organize your music.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-3 rounded-md border border-border/50 bg-background hover:bg-background/80 transition-colors cursor-pointer"
                  onClick={() => router.push(`/playlists/${pl.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded bg-[#282828] flex items-center justify-center overflow-hidden shrink-0">
                      {pl.coverUrl ? (
                        <img src={pl.coverUrl} alt={pl.title} className="h-full w-full object-cover" />
                      ) : (
                        <Music2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pl.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {pl.tracksCount != null ? `${pl.tracksCount} song${pl.tracksCount === 1 ? '' : 's'}` : 'Playlist'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Track Form (approved only) */}
      {status === "approved" && (
        <div className="rounded-lg border border-border bg-background-secondary p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Upload className="h-5 w-5" /> Submit a Track</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="t-title">Title</Label>
              <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Song title" className="bg-background border-border/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-artist-name">Artist name (optional)</Label>
              <Input id="t-artist-name" value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Your artist name" className="bg-background border-border/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-artists">by</Label>
              <Input id="t-artists" value={artists} onChange={(e) => setArtists(e.target.value)} placeholder="Your username" className="bg-background border-border/40" readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-album">Album (optional)</Label>
              <Input id="t-album" value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Album name" className="bg-background border-border/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-date">Release date (optional)</Label>
              <Input id="t-date" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="bg-background border-border/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-genre">Genre (optional)</Label>
              <Input id="t-genre" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Electronic" className="bg-background border-border/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-cover-file">Cover image (required)</Label>
              <Input id="t-cover-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setCoverFile(f);
                if (f) {
                  const url = URL.createObjectURL(f);
                  setCoverPreview(url);
                } else {
                  setCoverPreview("");
                }
              }} className="bg-background border-border/40" />
              {coverPreview && (
                <div className="pt-1">
                  <img src={coverPreview} alt="Cover preview" className="h-24 w-24 object-cover rounded" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Explicit</Label>
              <div className="flex items-center gap-3 text-sm">
                <button type="button" onClick={() => setExplicit(false)} className={`px-3 py-1 rounded-full border ${!explicit ? "border-white/60" : "border-border/50 text-muted-foreground"}`}>No</button>
                <button type="button" onClick={() => setExplicit(true)} className={`px-3 py-1 rounded-full border ${explicit ? "border-white/60" : "border-border/50 text-muted-foreground"}`}>Yes</button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <div className="flex items-center gap-3 text-sm">
                <button type="button" onClick={() => setSourceType("external")} className={`px-3 py-1 rounded-full border ${sourceType === "external" ? "border-white/60" : "border-border/50 text-muted-foreground"}`}>External URL</button>
              </div>
            </div>
          </div>

          {sourceType === "external" && (
            <div className="mt-4 space-y-4">
              {/* NEW: Audio File Upload */}
              <div className="space-y-2">
                <Label>Audio File</Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                    isDragging 
                      ? 'border-[#1db954] bg-[#1db954]/10' 
                      : 'border-border/40 hover:border-border/60'
                  }`}
                >
                  {!audioFile ? (
                    <div className="text-center">
                      <UploadIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm font-medium mb-1">
                        Drag & drop your MP3 or M4A file here
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        or click to browse (Max 100MB)
                      </p>
                      <input
                        id="audio-upload"
                        type="file"
                        accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/m4a,.mp3,.m4a"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAudioFile(file);
                            handleAudioFileUpload(file);
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('audio-upload')?.click()}
                        className="mx-auto"
                      >
                        Choose File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Music2 className="h-8 w-8 text-[#1db954]" />
                          <div>
                            <p className="text-sm font-medium">{audioFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        {!audioUploading && audioUploadProgress === 100 && (
                          <button
                            onClick={() => {
                              setAudioFile(null);
                              setAudioUploadProgress(0);
                              setOriginalUrl('');
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      
                      {audioUploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Uploading to Dropbox...
                            </span>
                            <span className="font-medium">{audioUploadProgress}%</span>
                          </div>
                          <div className="h-2 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1db954] transition-all duration-300"
                              style={{ width: `${audioUploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {audioUploadProgress === 100 && !audioUploading && (
                        <div className="flex items-center gap-2 text-xs text-emerald-400">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Uploaded successfully</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload your MP3 or M4A file and we'll automatically store it on Dropbox
                </p>
              </div>

              {/* OR Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="t-source">Public direct audio URL</Label>
                <Input 
                  id="t-source" 
                  value={originalUrl} 
                  onChange={(e) => setOriginalUrl(e.target.value)} 
                  placeholder="https://...mp3" 
                  className="bg-background border-border/40"
                  disabled={audioUploading || (audioFile !== null && audioUploadProgress === 100)}
                />
                <p className="text-xs text-muted-foreground">
                  Prefer uploading to cloud storage (S3). For Google Drive, make a public direct link: https://drive.google.com/uc?export=download&id=FILE_ID. Private links will fail.
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSubmitTrack} disabled={submittingTrack} className="bg-[#1db954] hover:bg-[#18a84d]">
              {submittingTrack ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</> : "Submit track"}
            </Button>
          </div>
        </div>
      )}

      {/* Submissions list */}
      <div className="rounded-lg border border-border bg-background-secondary p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Your submissions</h2>
          <Button variant="ghost" size="icon" onClick={loadTracks} className="h-8 w-8" aria-label="Refresh list">
            <RefreshCw className={`h-4 w-4 ${tracksLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {tracksLoading ? (
          <div className="py-10 flex items-center justify-center text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading submissions…
          </div>
        ) : tracks.length === 0 ? (
          <div className="py-8 text-sm text-muted-foreground">No submissions yet.</div>
        ) : (
          <ul className="space-y-3">
            {tracks.map((t) => (
              <li key={t.trackId} className="p-3 rounded-md border border-border/50 bg-background flex items-center justify-between">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {t.title}
                    {stateBadge(t.state)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Updated {new Date(t.lastUpdate * 1000).toLocaleString()}</p>
                  {t.state === "rejected" && (
                    <p className="text-xs text-rose-300 mt-1">{t.notes ? `Reason: ${t.notes}` : "Your submission was rejected."}</p>
                  )}
                  {t.state === "live" && (
                    <p className="text-xs text-emerald-300 mt-1">Approved and live on Unisin.</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {t.state === "live" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedTrackId(t.trackId);
                        setAddToPlaylistOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add to Playlist
                    </Button>
                  )}
                  {(t.state === "rejected" || t.state === "processing") && (
                    <Button size="sm" variant="outline" onClick={() => retryFetch(t.trackId)}>Retry</Button>
                  )}
                  {t.state !== "live" && (
                    <Button size="sm" onClick={() => submitForReview(t.trackId)}>Submit for review</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Browse/Search Music Dialog */}
      <Dialog open={browseTracksOpen} onOpenChange={setBrowseTracksOpen}>
        <DialogContent className="bg-background-secondary border-border/40 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Browse Music</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchTracks(e.target.value);
                }}
                placeholder="Search for tracks to add to your playlists..."
                className="pl-10 bg-background border-border/40"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {searching ? (
              <div className="py-12 flex items-center justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching…
              </div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No tracks found. Try a different search term.
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>Search for tracks to add to your playlists</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {searchResults.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      setSelectedTrackId(track.id);
                      setAddToPlaylistOpen(true);
                    }}
                    className="w-full p-3 rounded-md border border-border/50 bg-background hover:bg-background/80 transition-colors text-left flex items-center gap-3"
                  >
                    <div className="h-12 w-12 rounded bg-[#282828] flex items-center justify-center overflow-hidden shrink-0">
                      {track.imageUrl ? (
                        <img src={track.imageUrl} alt={track.title} className="h-full w-full object-cover" />
                      ) : (
                        <Music2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                    </div>
                    <Plus className="h-5 w-5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Playlist Dialog */}
      <Dialog open={createPlaylistOpen} onOpenChange={setCreatePlaylistOpen}>
        <DialogContent className="bg-background-secondary border-border/40">
          <DialogHeader>
            <DialogTitle>Create Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pl-title">Playlist Title</Label>
              <Input
                id="pl-title"
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                placeholder="My Awesome Playlist"
                className="bg-background border-border/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pl-desc">Description (optional)</Label>
              <textarea
                id="pl-desc"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                placeholder="A collection of my best tracks..."
                className="bg-background border border-border/40 rounded-md p-2 h-20 w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setCreatePlaylistOpen(false);
                setNewPlaylistTitle("");
                setNewPlaylistDesc("");
              }}
              disabled={creatingPlaylist}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlaylist}
              disabled={creatingPlaylist}
              className="bg-[#1db954] hover:bg-[#18a84d]"
            >
              {creatingPlaylist ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Playlist Dialog */}
      <Dialog open={addToPlaylistOpen} onOpenChange={setAddToPlaylistOpen}>
        <DialogContent className="bg-background-secondary border-border/40">
          <DialogHeader>
            <DialogTitle>Add Track to Playlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {playlists.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm mb-3">No playlists yet</p>
                <Button
                  onClick={() => {
                    setAddToPlaylistOpen(false);
                    setCreatePlaylistOpen(true);
                  }}
                  size="sm"
                  className="bg-[#1db954] hover:bg-[#18a84d]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Playlist
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => handleAddToPlaylist(pl.id)}
                    disabled={addingToPlaylist}
                    className="w-full p-3 rounded-md border border-border/50 bg-background hover:bg-background/80 transition-colors text-left flex items-center gap-3 disabled:opacity-50"
                  >
                    <div className="h-10 w-10 rounded bg-[#282828] flex items-center justify-center overflow-hidden shrink-0">
                      {pl.coverUrl ? (
                        <img src={pl.coverUrl} alt={pl.title} className="h-full w-full object-cover" />
                      ) : (
                        <Music2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{pl.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {pl.tracksCount != null ? `${pl.tracksCount} song${pl.tracksCount === 1 ? '' : 's'}` : 'Playlist'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setAddToPlaylistOpen(false);
                setSelectedTrackId(null);
              }}
              disabled={addingToPlaylist}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="bg-background-secondary border-border/40">
          <DialogHeader>
            <DialogTitle>Creator application</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Display name</Label>
              <Input id="c-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Artist or creator name" className="bg-background border-border/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-background border-border/40" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="c-instagram">Instagram</Label>
              <Input 
                id="c-instagram" 
                value={instagram} 
                onChange={(e) => setInstagram(e.target.value)} 
                placeholder="@yourusername" 
                className="bg-background border-border/40" 
              />
              <p className="text-xs text-muted-foreground">
                Follow on Instagram for Fast Approval
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-country">Country</Label>
              <Input id="c-country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" className="bg-background border-border/40" />
            </div>
            <div className="flex items-center gap-2 text-sm md:col-span-2 mt-2">
              <input id="c-terms" type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="h-4 w-4" />
              <Label htmlFor="c-terms" className="text-sm">I accept the terms and certify I own the rights to the content</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApplyOpen(false)} disabled={applySubmitting}>Cancel</Button>
            <Button onClick={handleApply} disabled={applySubmitting} className="bg-[#1db954] hover:bg-[#18a84d]">
              {applySubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</> : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}