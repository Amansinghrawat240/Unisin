"use client";

import React from "react";
import { PlayerProvider } from "@/lib/hooks/use-player";
import PlayerBar from "./player-bar";
import { MobileMusicPlayer } from "./mobile-music-player";

export const PlayerClient = ({ children }: { children: React.ReactNode }) => {
  return (
    <PlayerProvider>
      {children}
      {/* Desktop Player - Hidden on mobile */}
      <div className="hidden md:block">
        <PlayerBar />
      </div>
      {/* Mobile Player - Only visible on mobile */}
      <MobileMusicPlayer />
    </PlayerProvider>
  );
};

export default PlayerClient;