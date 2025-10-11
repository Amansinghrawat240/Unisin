"use client";

import { useEffect, useState } from "react";
import { Search, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Track {
  id: number;
  title: string;
  imageUrl: string | null;
  audioUrl: string;
  durationSec: number;
  explicit: boolean;
  artists?: Array<{ id: number; name: string }>;
}

export default function MusicManagerClient() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTrack, setEditingTrack] = useState<number | null>(null);
  const [editData, setEditData] = useState({ title: "", explicit: false });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("bearer_token");
      const adminEmail = localStorage.getItem("admin_email");
      
      if (!token || !adminEmail) {
        toast.error("Please login as admin first");
        window.location.href = "/admin/login";
        return;
      }
      
      loadTracks();
    };
    
    checkAuth();
  }, []);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      
      const res = await fetch("/api/tracks", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Failed to load tracks");

      const data = await res.json();
      setTracks(data);
    } catch (error) {
      toast.error("Failed to load tracks");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (track: Track) => {
    setEditingTrack(track.id);
    setEditData({
      title: track.title,
      explicit: track.explicit,
    });
  };

  const saveEdit = async (trackId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");

      const res = await fetch(`/api/tracks/${trackId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (!res.ok) throw new Error("Failed to update track");

      toast.success("Track updated");
      setEditingTrack(null);
      loadTracks();
    } catch (error) {
      toast.error("Failed to update track");
    }
  };

  const deleteTrack = async (trackId: number) => {
    if (!confirm("Delete this track? This cannot be undone.")) return;

    try {
      const token = localStorage.getItem("bearer_token");

      const res = await fetch(`/api/tracks/${trackId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete track");

      toast.success("Track deleted");
      loadTracks();
    } catch (error) {
      toast.error("Failed to delete track");
    }
  };

  const filteredTracks = tracks.filter((track) =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artists?.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading music library...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Music Manager</h1>
        <p className="text-white/60 mt-1">
          Edit music metadata, manage tracks across your platform
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tracks or artists..."
          className="w-full bg-[#181818] border border-white/20 rounded-lg pl-10 pr-3 py-3 text-white placeholder:text-white/40"
        />
      </div>

      <div className="rounded-lg border border-white/10 bg-[#181818] overflow-hidden">
        {filteredTracks.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            {searchQuery ? "No tracks found" : "No tracks available"}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredTracks.map((track) => (
              <div
                key={track.id}
                className="p-4 hover:bg-white/5 transition flex items-center gap-4"
              >
                {track.imageUrl && (
                  <Image
                    src={track.imageUrl}
                    alt={track.title}
                    width={48}
                    height={48}
                    className="rounded"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  {editingTrack === track.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        className="w-full bg-[#282828] border border-white/20 rounded px-3 py-1.5 text-white"
                        placeholder="Track title"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editData.explicit}
                          onChange={(e) => setEditData({ ...editData, explicit: e.target.checked })}
                          className="rounded"
                        />
                        Explicit content
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(track.id)}
                          className="flex items-center gap-1 text-xs text-primary hover:brightness-110"
                        >
                          <Save className="h-3 w-3" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTrack(null)}
                          className="flex items-center gap-1 text-xs text-white/60 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{track.title}</h3>
                        {track.explicit && (
                          <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-[#6a6a6a] text-background rounded-sm">
                            E
                          </span>
                        )}
                      </div>
                      {track.artists && track.artists.length > 0 && (
                        <p className="text-sm text-white/60">
                          {track.artists.map(a => a.name).join(", ")}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(track)}
                    className="p-2 hover:bg-white/10 rounded transition"
                    title="Edit track"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteTrack(track.id)}
                    className="p-2 hover:bg-red-500/20 text-red-500 rounded transition"
                    title="Delete track"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}