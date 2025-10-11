"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Play, Music, MoreHorizontal, Verified, Share2, ChevronLeft } from "lucide-react";
import { usePlayer } from "@/lib/hooks/use-player";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/ui/like-button";
import { toast } from "sonner";

interface ArtistTrack {
  id: number;
  title: string;
  artists: string[];
  imageUrl: string | null;
  audioUrl: string | null;
  explicit: boolean;
  durationSec: number;
}

interface ArtistPlaylist {
  id: number;
  title: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ArtistProfile {
  id: number;
  name: string;
  slug: string;
  bio: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  popularity: number;
  userId: string | null;
  isVerified: boolean;
  monthlyListeners: number;
  tracks?: ArtistTrack[];
  trackCount: number;
  playlists?: ArtistPlaylist[];
  playlistCount: number;
}

export default function ArtistProfileClient({ slug }: { slug: string }) {
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { playTrack } = usePlayer();
  const router = useRouter();

  useEffect(() => {
    const loadArtist = async () => {
      try {
        setLoading(true);
        
        const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
        
        const res = await fetch(`/api/artists/slug?slug=${encodeURIComponent(slug)}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        
        if (!res.ok) {
          if (res.status === 404) {
            setError("Artist not found");
          } else {
            setError("Failed to load artist profile");
          }
          return;
        }

        const artistData = await res.json();
        // Ensure tracks is always an array
        if (!artistData.tracks) {
          artistData.tracks = [];
        }
        // Ensure playlists is always an array
        if (!artistData.playlists) {
          artistData.playlists = [];
        }
        setArtist(artistData);

        // Load follow status if authenticated
        if (token && artistData.id) {
          const statusRes = await fetch(`/api/artists/${artistData.id}/follow/status`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (statusRes.ok) {
            const { isFollowing } = await statusRes.json();
            setIsFollowing(isFollowing);
          }
        }
      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    loadArtist();
  }, [slug]);

  const handleFollowToggle = async () => {
    if (!artist) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
    if (!token) {
      toast.error("Please log in to follow artists");
      return;
    }

    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`/api/artists/${artist.id}/follow`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update follow status');
      }

      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? 'Unfollowed artist' : 'Following artist');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePlayTrack = (track: ArtistTrack) => {
    if (!track.audioUrl) return;
    playTrack({
      id: String(track.id),
      title: track.title,
      artists: track.artists,
      imageUrl: track.imageUrl || "/favicon.ico",
      audioUrl: track.audioUrl,
    });
  };

  const formatMonthlyListeners = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gradient-to-b from-[#535353] to-[#181818] p-8 h-96" />
        <div className="animate-pulse bg-[#181818]/80 p-6 h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212]">
        <div className="text-center">
          <p className="mb-4 text-xl text-white">Artist not found</p>
          <Link
            href="/"
            className="text-[#1db954] hover:underline"
          >
            Return to UniSin Home
          </Link>
        </div>
      </div>
    );
  }

  if (!artist) {
    return null;
  }

  const artistInitial = artist.name.slice(0, 1).toUpperCase();
  const artistTracks = artist.tracks || [];
  const artistPlaylists = artist.playlists || [];

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Mobile-First Hero Section - UniSin Style */}
      <section className="relative">
        {/* Gradient Background */}
        <div className="relative bg-gradient-to-b from-purple-600 via-purple-700 to-[#121212] pt-16 pb-8 px-6">
          {/* Back Button - Top Left */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 h-10 w-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 active:scale-95 transition-all backdrop-blur-sm"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>

          {/* Centered Profile Image */}
          <div className="flex flex-col items-center">
            <div className="relative h-48 w-48 shrink-0 rounded-full bg-[#282828] flex items-center justify-center overflow-hidden shadow-2xl mb-6">
              {artist.imageUrl ? (
                <Image
                  src={artist.imageUrl}
                  alt={artist.name}
                  width={192}
                  height={192}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-7xl font-bold text-white">{artistInitial}</span>
              )}
            </div>

            {/* Centered Artist Info */}
            <div className="text-center w-full">
              {artist.isVerified && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Verified className="h-4 w-4 fill-blue-500 text-blue-500" />
                  <span className="text-xs font-semibold text-white">Verified Artist</span>
                </div>
              )}
              <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-3 text-white px-4">
                {artist.name}
              </h1>
              {artist.monthlyListeners > 0 && (
                <p className="text-sm text-white/90 font-medium">
                  {formatMonthlyListeners(artist.monthlyListeners)} monthly listeners
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Mobile Optimized */}
        <div className="bg-gradient-to-b from-[#121212] to-[#121212] px-6 py-6">
          <div className="flex items-center justify-start gap-4">
            {/* Large Play Button */}
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 active:scale-95 transition-transform shadow-lg"
              onClick={() => artistTracks[0] && handlePlayTrack(artistTracks[0])}
              disabled={artistTracks.length === 0}
            >
              <Play className="h-6 w-6 fill-current ml-0.5" />
            </Button>
            
            {/* Follow Button */}
            <Button
              variant="outline"
              className="rounded-full px-7 py-2.5 border-white/30 text-white hover:border-white/50 active:scale-95 transition-transform min-h-[44px]"
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              <span className="text-sm font-semibold">
                {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
              </span>
            </Button>
            
            {/* More Options Button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-11 w-11 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
            >
              <MoreHorizontal className="h-6 w-6 text-white" />
            </Button>
          </div>
        </div>
      </section>

      {/* Popular Tracks Section */}
      {slug !== "unisin" && (
        <section className="px-4 py-6">
          <h2 className="text-2xl font-bold mb-4 px-2">Popular</h2>
          
          {artistTracks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 px-2">No tracks available yet</p>
          ) : (
            <div className="space-y-1">
              {artistTracks.slice(0, 5).map((track, idx) => (
                <div
                  key={track.id}
                  className="group active:bg-white/10 rounded-md p-3 transition-colors duration-150 flex items-center gap-3 min-h-[64px]"
                >
                  {/* Track Image */}
                  <div className="relative h-12 w-12 shrink-0 rounded bg-[#282828] overflow-hidden">
                    {track.imageUrl ? (
                      <Image
                        src={track.imageUrl}
                        alt={track.title}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Music className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-white truncate text-base leading-tight">{track.title}</p>
                      {track.explicit && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-[#6a6a6a] text-white rounded shrink-0">
                          E
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{Math.floor(track.durationSec / 60)}:{(track.durationSec % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>

                  {/* More Options */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full hover:bg-white/10 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <MoreHorizontal className="h-5 w-5 text-white/70" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Playlists Section */}
      {artistPlaylists.length > 0 && (
        <section className="px-4 py-6">
          <h2 className="text-2xl font-bold mb-4 px-2">Playlists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {artistPlaylists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlists/${playlist.id}`}
                className="group"
              >
                <div className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-colors">
                  <div className="relative aspect-square mb-4 rounded overflow-hidden bg-[#282828]">
                    {playlist.coverUrl ? (
                      <Image
                        src={playlist.coverUrl}
                        alt={playlist.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Music className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-white mb-2 truncate group-hover:underline">
                    {playlist.title}
                  </h3>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* About Section */}
      {artist.bio && (
        <section className="px-6 py-6">
          <h2 className="text-2xl font-bold mb-6">About</h2>
          {artist.imageUrl && (
            <div className="relative h-[320px] w-full overflow-hidden rounded-lg mb-6">
              <Image
                src={artist.imageUrl}
                alt={artist.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          {artist.monthlyListeners > 0 && (
            <p className="text-3xl font-bold mb-4 text-white">
              {formatMonthlyListeners(artist.monthlyListeners)} monthly listeners
            </p>
          )}
          <p className="text-sm text-white/80 leading-relaxed">
            {artist.bio}
          </p>
        </section>
      )}

      {/* Bottom Spacing for Mobile Nav */}
      <div className="h-24" />
    </div>
  );
}
