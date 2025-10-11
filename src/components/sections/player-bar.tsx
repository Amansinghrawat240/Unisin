"use client";

import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useMemo, useState, useCallback, useEffect } from "react";
import { usePlayer } from "@/lib/hooks/use-player";
import Image from "next/image";

export const PlayerBar = () => {
  const {
    current,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    next,
    prev,
    seek,
    volume,
    setVolume,
    muted,
    toggleMute,
  } = usePlayer();

  // Prevent hydration mismatch by only showing player after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scrubbing state to keep UI smooth and only seek on release
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const effectiveTime = isScrubbing ? scrubValue : currentTime;
  const hasDuration = Number.isFinite(duration) && duration > 0;

  const progress = useMemo(() => {
    if (!hasDuration) return 0;
    return Math.min(100, Math.max(0, (effectiveTime / duration) * 100));
  }, [effectiveTime, duration, hasDuration]);

  const onScrubStart = useCallback(() => {
    setIsScrubbing(true);
    setScrubValue(Number.isFinite(currentTime) ? currentTime : 0);
  }, [currentTime]);

  const onScrub = useCallback((val: number) => {
    setScrubValue(val);
  }, []);

  const onScrubEnd = useCallback(() => {
    setIsScrubbing(false);
    seek(scrubValue);
  }, [seek, scrubValue]);

  // Always render placeholder on server to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // After mount, render actual player state
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[#181818] border-t border-[#2a2a2a] pointer-events-auto">
      {current ? (
        <div className="mx-auto max-w-[1400px] px-4 py-3 grid grid-cols-3 gap-4 items-center">
          {/* Left: Artwork & meta */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-14 h-14 overflow-hidden rounded bg-[#282828]">
              <Image 
                src={current.imageUrl || '/favicon.ico'} 
                alt={current.title}
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/favicon.ico';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{current.title}</div>
              <div className="text-xs text-muted-foreground truncate">{current.artists.join(", ")}</div>
            </div>
          </div>

          {/* Middle: Controls */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <button onClick={prev} className="text-white/80 hover:text-white" aria-label="Previous">
                <SkipBack size={18} />
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg:white text-black flex items-center justify-center hover:scale-105 transition bg-white"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="pl-0.5" />}
              </button>
              <button onClick={next} className="text-white/80 hover:text-white" aria-label="Next">
                <SkipForward size={18} />
              </button>
            </div>
            <div className="w-full flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground w-9 text-right tabular-nums">
                {formatTime(effectiveTime)}
              </span>
              <input
                className="w-full h-1.5 appearance-none bg-[#3e3e3e] rounded-full cursor-pointer"
                type="range"
                min={0}
                max={hasDuration ? duration : Math.max(currentTime + 10, 30)}
                step={0.1}
                value={Number.isFinite(effectiveTime) ? Math.min(effectiveTime, hasDuration ? duration : Math.max(currentTime + 10, 30)) : 0}
                onPointerDown={onScrubStart}
                onPointerUp={onScrubEnd}
                onTouchStart={onScrubStart}
                onTouchEnd={onScrubEnd}
                onChange={(e) => onScrub(Number(e.target.value))}
                aria-valuetext={`${formatTime(effectiveTime)} of ${hasDuration ? formatTime(duration) : "--:--"}`}
              />
              <span className="text-[11px] text-muted-foreground w-9 tabular-nums">
                {hasDuration ? formatTime(duration) : "--:--"}
              </span>
            </div>
          </div>

          {/* Right: Volume */}
          <div className="flex items-center justify-end gap-3">
            <button onClick={toggleMute} className="text-white/80 hover:text-white" aria-label="Mute">
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              className="w-28 h-1.5 appearance-none bg-[#3e3e3e] rounded-full cursor-pointer"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

function formatTime(t: number) {
  if (!Number.isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default PlayerBar;