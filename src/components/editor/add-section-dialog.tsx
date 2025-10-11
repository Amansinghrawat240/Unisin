"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface AddSectionDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSectionDialog({ onClose, onSuccess }: AddSectionDialogProps) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [type, setType] = useState<"playlist_carousel" | "track_grid" | "artist_grid">("playlist_carousel");
  const [position, setPosition] = useState("1");
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a section title");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      const adminEmail = localStorage.getItem("admin_email");

      const res = await fetch("/api/editor/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-test-user-email": adminEmail || "",
        },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          type,
          position: parseInt(position),
          isVisible,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create section");
      }

      toast.success("Section created successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Create section error:", error);
      toast.error(error.message || "Failed to create section");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-lg bg-[#282828] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Create New Section</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Section Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Editor's Picks, Trending Now"
              className="w-full bg-[#181818] border border-white/20 rounded px-3 py-2 text-white placeholder:text-white/40"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subtitle (optional)</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g., Hand-curated playlists for every mood"
              className="w-full bg-[#181818] border border-white/20 rounded px-3 py-2 text-white placeholder:text-white/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Section Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-[#181818] border border-white/20 rounded px-3 py-2 text-white"
              required
            >
              <option value="playlist_carousel">Playlist Carousel</option>
              <option value="track_grid">Track Grid</option>
              <option value="artist_grid">Artist Grid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Position *</label>
            <input
              type="number"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              min="1"
              className="w-full bg-[#181818] border border-white/20 rounded px-3 py-2 text-white"
              required
            />
            <p className="text-xs text-white/40 mt-1">
              Lower numbers appear first (1 = top)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isVisible"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isVisible" className="text-sm">
              Visible on homepage
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-white/40 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}