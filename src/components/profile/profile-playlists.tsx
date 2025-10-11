"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ListMusic } from "lucide-react";

type Playlist = {
  id: number | string;
  title?: string;
  name?: string;
  description?: string | null;
  coverUrl?: string | null;
};

export const ProfilePlaylists: React.FC = () => {
  const [own, setOwn] = useState<Playlist[]>([]);
  const [followed, setFollowed] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
        const res = await fetch("/api/me/library", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });
        if (!res.ok) {
          if (res.status === 401) {
            setOwn([]);
            setFollowed([]);
            setError("Please log in to see your playlists.");
            return;
          }
          throw new Error("Failed to load playlists");
        }
        const data = await res.json().catch(() => ({}));
        const clean = (arr: any[] = []) => Array.isArray(arr) ? arr.filter((pl) => (pl?.title || pl?.name)) : [];
        setOwn(clean(data?.own));
        setFollowed(clean(data?.followed));
      } catch (e: any) {
        setError(e?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const PlaylistCard = ({ pl }: { pl: Playlist }) => {
    const title = pl.title || pl.name || "Untitled";
    
    return (
      <Link
        href={`/playlists/${pl.id}`}
        className="group bg-[#1a1a1a] hover:bg-[#282828] p-4 rounded-lg transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl"
      >
        <div className="relative mb-4 aspect-square">
          <div className="h-full w-full rounded-md bg-[#282828] overflow-hidden shadow-lg">
            {pl.coverUrl ? (
              <Image
                src={pl.coverUrl}
                alt={title}
                width={200}
                height={200}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#333333] to-[#1a1a1a]">
                <ListMusic className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Play button overlay on hover */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
            <div className="h-12 w-12 rounded-full bg-[#1db954] flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-[#1ed760]">
              <Play className="h-5 w-5 text-black fill-black ml-0.5" />
            </div>
          </div>
        </div>
        
        <h3 className="font-bold text-white text-sm mb-1 truncate">{title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {pl.description || "Playlist"}
        </p>
      </Link>
    );
  };

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Your Playlists</h2>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-[#1a1a1a] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-zinc-400">{error}</p>
      )}

      {!loading && !error && own.length === 0 && followed.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-6">
          <p className="text-sm text-zinc-300">You have no playlists yet.</p>
          <p className="text-xs text-zinc-500 mt-1">Use the + button in Your Library to create one.</p>
        </div>
      )}

      {!loading && !error && (own.length > 0 || followed.length > 0) && (
        <div className="space-y-6">
          {own.length > 0 && (
            <div>
              <p className="text-sm text-zinc-400 mb-3">Created by you</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {own.map((pl) => (
                  <PlaylistCard key={`own-${pl.id}`} pl={pl} />
                ))}
              </div>
            </div>
          )}

          {followed.length > 0 && (
            <div>
              <p className="text-sm text-zinc-400 mb-3">Followed</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {followed.map((pl) => (
                  <PlaylistCard key={`followed-${pl.id}`} pl={pl} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};