"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface AddContentDialogProps {
  sectionId: number;
  sectionTitle: string;
  sectionType: "playlist_carousel" | "track_grid" | "artist_grid";
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddContentDialog({
  sectionId,
  sectionTitle,
  sectionType,
  open,
  onClose,
  onSuccess
}: AddContentDialogProps) {
  // Allow user to select content type regardless of section type
  const [contentType, setContentType] = useState<"playlist" | "track" | "artist">(
    sectionType === "playlist_carousel" ? "playlist" : 
    sectionType === "track_grid" ? "track" : "artist"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  // Reset content type when section type changes
  useEffect(() => {
    setContentType(
      sectionType === "playlist_carousel" ? "playlist" : 
      sectionType === "track_grid" ? "track" : "artist"
    );
  }, [sectionType]);

  // Search function
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      let endpoint = "";
      if (contentType === "playlist") {
        endpoint = `/api/search?q=${encodeURIComponent(searchQuery)}&type=playlist`;
      } else if (contentType === "track") {
        endpoint = `/api/search?q=${encodeURIComponent(searchQuery)}&type=track`;
      } else if (contentType === "artist") {
        endpoint = `/api/search?q=${encodeURIComponent(searchQuery)}&type=artist`;
      }

      const res = await fetch(endpoint, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, contentType]);

  const addToSection = async (itemId: number) => {
    setAddingId(itemId);
    try {
      console.log("Adding to section:", { sectionId, contentType, itemId });
      
      const response = await fetch(`/api/editor/sections/${sectionId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemType: contentType,
          itemId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API error response:", error);
        throw new Error(error.error || "Failed to add item");
      }

      toast.success(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} added to section`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error adding item:", error);
      toast.error(error.message || "Failed to add item to section");
    } finally {
      setAddingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-[#282828] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-2xl font-bold text-white">
          Add Content to {sectionTitle}
        </h2>

        {/* Content Type Selector */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              setContentType("playlist");
              setSearchQuery("");
              setSearchResults([]);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              contentType === "playlist"
                ? "bg-[#1db954] text-white"
                : "bg-[#3e3e3e] text-white/70 hover:bg-[#4a4a4a] hover:text-white"
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => {
              setContentType("track");
              setSearchQuery("");
              setSearchResults([]);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              contentType === "track"
                ? "bg-[#1db954] text-white"
                : "bg-[#3e3e3e] text-white/70 hover:bg-[#4a4a4a] hover:text-white"
            }`}
          >
            Tracks
          </button>
          <button
            onClick={() => {
              setContentType("artist");
              setSearchQuery("");
              setSearchResults([]);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              contentType === "artist"
                ? "bg-[#1db954] text-white"
                : "bg-[#3e3e3e] text-white/70 hover:bg-[#4a4a4a] hover:text-white"
            }`}
          >
            Artists
          </button>
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${contentType}s...`}
          className="mb-4 w-full rounded-lg bg-[#3e3e3e] px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#1db954]"
        />

        {/* Search Results */}
        <div className="max-h-96 space-y-2 overflow-y-auto scrollbar-unisin">
          {isSearching && (
            <p className="text-center text-white/50">Searching...</p>
          )}

          {!isSearching && searchQuery && searchResults.length === 0 && (
            <p className="text-center text-white/50">No {contentType}s found</p>
          )}

          {!searchQuery && !isSearching && (
            <p className="text-center text-white/50">
              Search for {contentType}s to add
            </p>
          )}

          {searchResults.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg bg-[#3e3e3e] p-3 transition hover:bg-[#4a4a4a]"
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name || item.title}
                  className={`h-12 w-12 object-cover ${
                    contentType === "artist" ? "rounded-full" : "rounded"
                  }`}
                />
              )}
              <div className="flex-1">
                <p className="font-semibold text-white">
                  {item.name || item.title}
                </p>
                {contentType === "track" && (
                  <p className="text-sm text-white/60">
                    {item.artistNames?.join(", ") || item.artistName || "Unknown Artist"}
                  </p>
                )}
                {contentType === "playlist" && (
                  <p className="text-sm text-white/60">
                    {item.trackCount || 0} tracks
                  </p>
                )}
                {contentType === "artist" && (
                  <p className="text-sm text-white/60">Artist</p>
                )}
              </div>
              <button
                onClick={() => {
                  console.log("Button clicked for item:", item);
                  addToSection(item.id);
                }}
                disabled={addingId === item.id}
                className="rounded-full bg-[#1db954] px-4 py-2 text-sm font-semibold text-white transition hover:scale-105 disabled:opacity-50"
              >
                {addingId === item.id ? "Adding..." : "Add"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}