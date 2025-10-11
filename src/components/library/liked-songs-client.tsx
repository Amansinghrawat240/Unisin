"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlayer, PlayerTrack } from "@/lib/hooks/use-player";
import { Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { LikeButton } from "@/components/ui/like-button";

interface TrackResult {
  id: number;
  title: string;
  durationSec: number;
  audioUrl: string;
  imageUrl: string | null;
  popularity?: number | null;
  explicit?: boolean;
}

export const LikedSongsClient = () => {
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<TrackResult[]>([]);
  const { setQueue, playTrack, current, isPlaying, togglePlay } = usePlayer();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/me/likes", {
          credentials: "include",
          cache: "no-store",
        });
        if (res.status === 401) {
          toast("Please log in to see your Liked Songs");
          setTracks([]);
          return;
        }
        const json = await res.json();
        setTracks(Array.isArray(json?.results) ? json.results : []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const playable = useMemo<PlayerTrack[]>(() => tracks.map(t => ({
    id: String(t.id),
    title: t.title,
    artists: [],
    imageUrl: t.imageUrl || "/favicon.ico",
    // Fallback to stream endpoint if API did not include a direct audioUrl
    audioUrl: t.audioUrl || `/api/playback/stream/${t.id}?redirect=1`,
  })), [tracks]);

  const onPlayAll = () => {
    if (!playable.length) return;
    setQueue(playable, 0);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <div className="h-20 w-20 rounded bg-gradient-to-br from-[#5a4bff] via-[#9b5cf6] to-[#e91e63] flex items-center justify-center text-white text-2xl font-black">
          ♥
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold">Liked Songs</h1>
          <p className="text-sm text-white/60">{tracks.length} saved {tracks.length === 1 ? "song" : "songs"}</p>
        </div>
        {playable.length > 0 && (
          <Button className="bg-[#1db954] hover:bg-[#18a84d] rounded-full px-6" onClick={onPlayAll}>
            <Play className="h-4 w-4 mr-2" /> Play
          </Button>
        )}
      </header>

      {loading && <p className="text-sm text-white/60">Loading your liked songs…</p>}
      {!loading && tracks.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-[#181818] p-6">
          <p className="text-sm text-white/70">No liked songs yet. Save songs from search and albums to see them here.</p>
        </div>
      )}

      {!loading && tracks.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {tracks.map((t) => (
            <Card key={t.id} className="bg-background-secondary border-border/40">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded bg-muted overflow-hidden flex-shrink-0">
                  {t.imageUrl ? (
                    <img src={t.imageUrl} alt={t.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-white/60">{Math.round((t.durationSec || 0) / 60)}m {(t.durationSec || 0) % 60}s</p>
                </div>
                <LikeButton trackId={t.id} size="sm" />
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => playTrack({ id: String(t.id), title: t.title, artists: [], imageUrl: t.imageUrl || "/favicon.ico", audioUrl: t.audioUrl || `/api/playback/stream/${t.id}?redirect=1` }, false)}
                >
                  {current?.id === String(t.id) && isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LikedSongsClient;
