"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Music, ListMusic, MoreHorizontal } from "lucide-react";
import { usePlayer } from "@/lib/hooks/use-player";
import { Button } from "@/components/ui/button";

interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  createdAt: Date;
}

interface Playlist {
  id: number;
  title: string;
  description: string | null;
  coverUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UploadedTrack {
  id: number;
  title: string;
  artists: string[];
  album: string | null;
  coverUrl: string | null;
  audioUrl: string | null;
  explicit: boolean;
  createdAt: Date;
}

interface UserProfileData {
  user: UserProfile;
  playlists: Playlist[];
  uploadedTracks: UploadedTrack[];
  stats: {
    playlistCount: number;
    uploadedTrackCount: number;
  };
}

export default function UserProfileClient({ userId }: { userId: string }) {
  const [data, setData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playTrack } = usePlayer();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        
        // Get bearer token from localStorage for authentication
        const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
        
        const res = await fetch(`/api/users/${userId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        
        if (!res.ok) {
          if (res.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load user profile");
          }
          return;
        }

        const profileData = await res.json();
        setData(profileData);
      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handlePlayTrack = (track: UploadedTrack) => {
    if (!track.audioUrl) return;
    playTrack({
      id: String(track.id),
      title: track.title,
      artists: track.artists,
      imageUrl: track.coverUrl || "/favicon.ico",
      audioUrl: track.audioUrl,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-2xl bg-gradient-to-b from-[#535353] to-[#181818] p-8 h-80" />
        <div className="animate-pulse rounded-2xl bg-[#181818]/80 p-6 h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#181818]/80 p-8">
        <p className="text-center text-muted-foreground">{error || "User not found"}</p>
      </div>
    );
  }

  const { user, playlists, uploadedTracks, stats } = data;
  const userInitial = user.name.slice(0, 1).toUpperCase();
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Hero Section with Gradient */}
      <section className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#535353] via-[#333333] to-[#181818] p-8 overflow-hidden shadow-2xl">
        <button className="absolute top-6 left-6 p-2 rounded-full hover:bg-black/20 transition">
          <MoreHorizontal className="h-5 w-5 text-white" />
        </button>

        <div className="flex items-end gap-6 mt-12">
          <div className="relative h-56 w-56 shrink-0 rounded-lg bg-[#282828] flex items-center justify-center overflow-hidden shadow-2xl">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={224}
                height={224}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-8xl font-bold text-white">{userInitial}</span>
            )}
          </div>

          <div className="flex-1 pb-4">
            <p className="text-sm font-bold uppercase tracking-wide text-white/90 mb-2">Profile</p>
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black leading-none mb-6 drop-shadow-lg">
              {user.name}
            </h1>
            <p className="text-sm text-white/90">
              {stats.playlistCount} Public Playlist{stats.playlistCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </section>

      {/* Public Playlists Section */}
      <section className="rounded-2xl border border-white/10 bg-[#181818]/80 p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-6">Public Playlists</h2>
        
        {playlists.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8">No public playlists yet</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlists/${playlist.id}`}
                className="group bg-[#1a1a1a] hover:bg-[#282828] p-4 rounded-lg transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl"
              >
                <div className="relative mb-4 aspect-square">
                  <div className="h-full w-full rounded-md bg-[#282828] overflow-hidden shadow-lg">
                    {playlist.coverUrl ? (
                      <Image
                        src={playlist.coverUrl}
                        alt={playlist.title}
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
                
                <h3 className="font-bold text-white text-sm mb-1 truncate group-hover:text-white">{playlist.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {playlist.description || `By ${user.name}`}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Music Uploaded Section */}
      <section className="rounded-2xl border border-white/10 bg-[#181818]/80 p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-6">Music Uploaded</h2>
        
        {uploadedTracks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8">No uploaded music yet</p>
        ) : (
          <div className="space-y-2">
            {uploadedTracks.map((track, idx) => (
              <div
                key={track.id}
                className="group bg-transparent hover:bg-[#282828] rounded-md p-3 transition-colors duration-150 flex items-center gap-4"
              >
                <div className="w-8 text-center shrink-0">
                  <span className="text-muted-foreground text-sm group-hover:hidden">{idx + 1}</span>
                  {track.audioUrl && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hidden group-hover:inline-flex h-8 w-8 p-0"
                      onClick={() => handlePlayTrack(track)}
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </Button>
                  )}
                </div>

                <div className="relative h-10 w-10 shrink-0 rounded bg-[#282828] overflow-hidden">
                  {track.coverUrl ? (
                    <Image
                      src={track.coverUrl}
                      alt={track.title}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Music className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white truncate">{track.title}</p>
                    {track.explicit && (
                      <span className="inline-flex items-center justify-center px-1 py-0.5 text-[9px] font-bold bg-[#6a6a6a] text-white rounded">
                        E
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.artists.join(', ')}
                  </p>
                </div>

                {track.album && (
                  <div className="hidden lg:block flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{track.album}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}