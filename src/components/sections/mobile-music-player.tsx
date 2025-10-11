"use client";

import { useState, useEffect, useRef } from "react";
import { usePlayer } from "@/lib/hooks/use-player";
import { Play, Pause, SkipBack, SkipForward, ChevronDown, MoreHorizontal, Volume2 } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { LikeButton } from "@/components/ui/like-button";

export function MobileMusicPlayer() {
  const {
    current,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    next,
    prev,
    seek,
  } = usePlayer();

  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [bgColor, setBgColor] = useState("rgba(26, 26, 26, 1)");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Wait for client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Extract dominant color from album art
  useEffect(() => {
    if (!current?.imageUrl) return;

    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.src = current.imageUrl;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);

      try {
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        let r = 0, g = 0, b = 0;
        let count = 0;

        // Sample pixels and calculate average
        for (let i = 0; i < data.length; i += 4 * 10) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        // Darken the color for better readability
        r = Math.floor(r * 0.6);
        g = Math.floor(g * 0.6);
        b = Math.floor(b * 0.6);

        setBgColor(`rgba(${r}, ${g}, ${b}, 1)`);
      } catch (e) {
        // CORS error or other issues
        setBgColor("rgba(26, 26, 26, 1)");
      }
    };

    img.onerror = () => {
      setBgColor("rgba(26, 26, 26, 1)");
    };
  }, [current?.imageUrl]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Return null during server render and initial client render
  if (!mounted || !current) return null;

  return (
    <>
      {/* Hidden canvas for color extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Collapsed Mini Player */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="md:hidden fixed bottom-[56px] left-0 right-0 z-50"
            onClick={() => setIsExpanded(true)}
          >
            <div 
              className="relative mx-2 mb-2 rounded-lg overflow-hidden shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${bgColor} 0%, rgba(0,0,0,0.9) 100%)`
              }}
            >
              {/* Progress line at top */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/20">
                <motion.div
                  className="h-full bg-white"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              <div className="flex items-center gap-3 p-3 pt-4">
                {/* Album Art */}
                <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={current.imageUrl || "/favicon.ico"}
                    alt={current.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {current.title}
                  </p>
                  <p className="text-white/70 text-xs truncate">
                    {current.artists.join(", ") || "Unknown Artist"}
                  </p>
                </div>

                {/* Play/Pause Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="w-10 h-10 flex items-center justify-center text-white"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" fill="white" />
                  ) : (
                    <Play className="w-6 h-6" fill="white" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Full-Screen Player */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="md:hidden fixed inset-0 z-[100] flex flex-col"
            style={{
              background: `linear-gradient(180deg, ${bgColor} 0%, rgba(0,0,0,1) 100%)`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-6">
              <button
                onClick={() => setIsExpanded(false)}
                className="w-10 h-10 flex items-center justify-center text-white"
              >
                <ChevronDown className="w-7 h-7" />
              </button>
              <p className="text-white/70 text-xs uppercase tracking-wider">
                Playing from playlist
              </p>
              <button className="w-10 h-10 flex items-center justify-center text-white">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* Album Art */}
            <div className="flex-1 flex items-center justify-center px-8 py-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative w-full max-w-[340px] aspect-square rounded-lg overflow-hidden shadow-2xl"
              >
                <Image
                  src={current.imageUrl || "/favicon.ico"}
                  alt={current.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </motion.div>
            </div>

            {/* Track Info & Controls */}
            <div className="px-6 pb-6">
              {/* Title & Artist */}
              <div className="mb-4">
                <h1 className="text-white text-2xl font-bold mb-1 truncate">
                  {current.title}
                </h1>
                <p className="text-white/70 text-sm truncate">
                  {current.artists.join(", ") || "Unknown Artist"}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, white ${progress}%, rgba(255,255,255,0.3) ${progress}%)`
                  }}
                />
                <div className="flex justify-between mt-2 text-xs text-white/70">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-6">
                  <button onClick={prev} className="text-white">
                    <SkipBack className="w-8 h-8" fill="white" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black shadow-xl"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8" fill="black" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" fill="black" />
                    )}
                  </button>
                  <button onClick={next} className="text-white">
                    <SkipForward className="w-8 h-8" fill="white" />
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between">
                <LikeButton 
                  trackId={typeof current.id === 'number' ? current.id : 0} 
                  size="lg"
                  className="text-white/70 hover:text-white"
                />
                <button className="text-white/70">
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
