"use client";

import { useEffect, useMemo, useState } from "react";

type Track = {
  id: number;
  title: string;
  durationSec: number;
  audioUrl: string;
  imageUrl: string | null;
  popularity: number;
  explicit: boolean;
  createdAt: string;
  albumTitle?: string | null;
  artistNames?: string[];
};

export const TracksManager = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Track | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingArtistId, setEditingArtistId] = useState<number | null>(null);
  const [editingArtistValue, setEditingArtistValue] = useState<string>("");
  const [savingArtist, setSavingArtist] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/tracks?limit=50&order=desc&sort=createdAt&query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(await res.text());
      const data: Track[] = await res.json();
      setTracks(data);
    } catch (e: any) {
      setError(e.message || "Failed to load tracks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const prettyDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this track? This cannot be undone.")) return;
    try {
      setDeletingId(id);
      const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const res = await fetch(`/api/tracks?id=${id}`, { 
        method: "DELETE",
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined,
      });
      if (!res.ok) throw new Error(await res.text());
      setTracks(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const saveArtistNames = async (trackId: number, newArtists: string) => {
    if (savingArtist) return;
    try {
      setSavingArtist(true);
      const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      
      // First, we need to parse the artist names and update the trackArtists junction table
      // For now, we'll update via a dedicated endpoint
      const res = await fetch(`/api/tracks/${trackId}/artists`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify({ artistNames: newArtists.split(',').map(a => a.trim()).filter(Boolean) }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      setEditingArtistId(null);
      setEditingArtistValue("");
      await load(); // Reload to get updated artist names
    } catch (e: any) {
      alert(e.message || "Failed to update artist names");
    } finally {
      setSavingArtist(false);
    }
  };

  const [fileUploading, setFileUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    setFileUploading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data.url as string;
    } finally {
      setFileUploading(false);
    }
  };

  const onSave = async (payload: Partial<Track> & { id: number }) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/tracks?id=${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          durationSec: payload.durationSec,
          audioUrl: payload.audioUrl,
          imageUrl: payload.imageUrl,
          explicit: payload.explicit,
          popularity: payload.popularity,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = (await res.json()) as Track;
      setTracks(prev => prev.map(t => (t.id === updated.id ? { ...t, ...updated } : t)));
      setEditing(null);
    } catch (e: any) {
      alert(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSearch} className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tracks or artists…"
          className="w-full rounded-md bg-[#1f1f1f] px-3 py-2 text-white placeholder:text-zinc-400 border border-white/10"
        />
        <button type="submit" className="rounded-md bg-[#2a2a2a] px-4 py-2 text-sm hover:bg-[#333]">Search</button>
      </form>

      {loading && <div className="text-sm text-zinc-400">Loading…</div>}
      {error && <div className="text-sm text-pink-400">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#151515] text-zinc-300">
            <tr>
              <th className="px-4 py-3">Cover</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Artists</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t) => (
              <tr key={t.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-4 py-3">
                  {t.imageUrl ? (
                    <img src={t.imageUrl} alt="cover" className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-[#222] grid place-items-center text-xs text-zinc-400">No cover</div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{t.title}</td>
                <td className="px-4 py-3 text-zinc-400">
                  {editingArtistId === t.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingArtistValue}
                        onChange={(e) => setEditingArtistValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            saveArtistNames(t.id, editingArtistValue);
                          } else if (e.key === "Escape") {
                            setEditingArtistId(null);
                            setEditingArtistValue("");
                          }
                        }}
                        placeholder="Artist1, Artist2"
                        className="w-48 rounded bg-[#1f1f1f] px-2 py-1 text-xs outline-none border border-white/20 focus:border-white/40"
                        autoFocus
                      />
                      <button
                        onClick={() => saveArtistNames(t.id, editingArtistValue)}
                        disabled={savingArtist}
                        className="rounded bg-[#1db954] px-2 py-1 text-[10px] text-black hover:brightness-95 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingArtistId(null);
                          setEditingArtistValue("");
                        }}
                        className="rounded bg-[#2a2a2a] px-2 py-1 text-[10px] hover:bg-[#333]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingArtistId(t.id);
                        setEditingArtistValue(t.artistNames?.join(", ") || "");
                      }}
                      className="hover:text-white underline decoration-dotted"
                      title="Click to edit artists"
                    >
                      {t.artistNames?.join(", ") || "—"}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-400">{prettyDuration(t.durationSec)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="rounded bg-[#2a2a2a] px-3 py-1.5 text-xs hover:bg-[#333]" onClick={() => setEditing(t)}>Edit</button>
                    {!t.imageUrl && (
                      <label className="rounded bg-[#2a2a2a] px-3 py-1.5 text-xs hover:bg-[#333] cursor-pointer">
                        Fix cover
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              const url = await uploadImage(f);
                              await onSave({ id: t.id, imageUrl: url });
                            } catch (err: any) {
                              alert(err?.message || "Failed to upload");
                            }
                          }}
                        />
                      </label>
                    )}
                    <button
                      className="rounded bg-[#3a1018] px-3 py-1.5 text-xs text-white hover:bg-[#4a1420] disabled:opacity-50"
                      disabled={deletingId === t.id}
                      onClick={() => handleDelete(t.id)}
                    >
                      {deletingId === t.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tracks.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">No tracks</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditDialog
          track={editing}
          onClose={() => setEditing(null)}
          onUpload={uploadImage}
          onSave={onSave}
          saving={saving}
          fileUploading={fileUploading}
        />
      )}
    </div>
  );
};

function EditDialog({ track, onClose, onSave, onUpload, saving, fileUploading }: {
  track: Track;
  onClose: () => void;
  onSave: (payload: Partial<Track> & { id: number }) => Promise<void>;
  onUpload: (file: File) => Promise<string>;
  saving: boolean;
  fileUploading: boolean;
}) {
  const [title, setTitle] = useState(track.title);
  const [durationSec, setDurationSec] = useState(track.durationSec);
  const [audioUrl, setAudioUrl] = useState(track.audioUrl);
  const [imageUrl, setImageUrl] = useState<string | null>(track.imageUrl || null);
  const [explicit, setExplicit] = useState<boolean>(!!track.explicit);
  const [popularity, setPopularity] = useState<number>(track.popularity || 0);

  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    const url = await onUpload(file);
    setImageUrl(url);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-xl border border-white/10 bg-[#181818] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit track</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-start gap-4">
            {(localPreview || imageUrl) ? (
              <img src={localPreview || imageUrl || ''} alt="cover" className="h-24 w-24 rounded object-cover" />
            ) : (
              <div className="h-24 w-24 rounded bg-[#222] grid place-items-center text-xs text-zinc-500">No cover</div>
            )}
            <div className="flex flex-col gap-2">
              <label className="inline-block rounded bg-[#2a2a2a] px-3 py-1.5 text-xs hover:bg-[#333] cursor-pointer w-max">
                Upload cover
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || undefined)} />
              </label>
              {fileUploading && <span className="text-xs text-zinc-400">Uploading…</span>}
              <input
                value={imageUrl || ""}
                onChange={(e) => setImageUrl(e.target.value || null)}
                placeholder="Or paste image URL"
                className="rounded-md bg-[#1f1f1f] px-3 py-2 text-white placeholder:text-zinc-400 border border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md bg-[#1f1f1f] px-3 py-2 text-white border border-white/10" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Duration (sec)</label>
              <input type="number" value={durationSec} onChange={(e) => setDurationSec(parseInt(e.target.value || '0'))} className="w-full rounded-md bg-[#1f1f1f] px-3 py-2 text-white border border-white/10" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">Audio URL</label>
              <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} className="w-full rounded-md bg-[#1f1f1f] px-3 py-2 text-white border border-white/10" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Popularity</label>
              <input type="number" value={popularity} onChange={(e) => setPopularity(parseInt(e.target.value || '0'))} className="w-full rounded-md bg-[#1f1f1f] px-3 py-2 text-white border border-white/10" />
            </div>
            <div className="flex items-center gap-2">
              <input id="explicit" type="checkbox" checked={explicit} onChange={(e) => setExplicit(e.target.checked)} />
              <label htmlFor="explicit" className="text-sm text-zinc-300">Explicit</label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md bg-[#2a2a2a] px-4 py-2 text-sm hover:bg-[#333]">Cancel</button>
          <button
            disabled={saving}
            onClick={() => onSave({ id: track.id, title, durationSec, audioUrl, imageUrl, explicit, popularity })}
            className="rounded-md bg-[#1db954] px-4 py-2 text-sm font-semibold text-black hover:brightness-95 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TracksManager;
