"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Search, Download, Bell, Users, X, Settings } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Renders the UniSin circular logo icon.
 * This is a visual representation based on common UniSin branding.
 */
function UniSinLogo({ className }: { className?: string }) {
  return (
    <Image
      src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/logo-1759993258957.png"
      alt="UniSin Logo"
      width={32}
      height={32}
      className={className}
    />
  );
}

const TopNavigation = () => {
    const { data: session, refetch } = useSession();
    const router = useRouter();
    
    // Detect Android browser
    const [isAndroid, setIsAndroid] = useState(false);
    
    const [userRole, setUserRole] = useState<{ role: string; isAdmin: boolean; isEditor: boolean; isCreator: boolean } | null>(null);
    
    // Search state
    const [searchValue, setSearchValue] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<any>(null);
    const [suggestLoading, setSuggestLoading] = useState(false);
    
    // Use session user directly
    const currentUser = session?.user;
    
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    
    // Show placeholder when search is empty
    const showCustomPlaceholder = !searchValue.trim();

    useEffect(() => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const androidDetected = /android/i.test(userAgent);
      setIsAndroid(androidDetected);
    }, []);

    // Fetch user role from API
    useEffect(() => {
      const fetchUserRole = async () => {
        if (session?.user) {
          try {
            const response = await fetch("/api/v1/me/role", {
              credentials: "include",
            });
            const data = await response.json();
            setUserRole(data);
          } catch (error) {
            console.error("Failed to fetch user role:", error);
            setUserRole({ role: "user", isAdmin: false, isEditor: false, isCreator: false });
          }
        }
      };

      if (session?.user) {
        fetchUserRole();
      } else {
        setUserRole(null);
      }
    }, [session]);
    
    // Auto-complete search with 1 second debounce and minimum 2 characters
    useEffect(() => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      const timer = setTimeout(async () => {
        setSearchLoading(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=all&limit=5`);
          const data = await res.json();
          const cats = data?.categories || {};
          const combined = [
            ...(cats.tracks || []).slice(0, 3),
            ...(cats.artists || []).slice(0, 2),
          ];
          setSearchResults(combined);
          setShowDropdown(combined.length > 0);
        } catch (error) {
          setSearchResults([]);
          setShowDropdown(false);
        } finally {
          setSearchLoading(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }, [query]);

    // Submit search helper
    const goSearch = () => {
      const q = searchValue.trim();
      if (!q) return;
      const c = (suggestions && suggestions.type === 'all') ? suggestions.categories : null;
      const hasQuickMatches = !!(c && ((c.tracks?.length || 0) + (c.albums?.length || 0) + (c.artists?.length || 0)));
      if (!suggestLoading && c && !hasQuickMatches) {
        router.push(`/creator?title=${encodeURIComponent(q)}`);
        return;
      }
      router.push(`/search?q=${encodeURIComponent(q)}`);
    };

    // Auto-navigate and fetch inline suggestions as user types (debounced)
    useEffect(() => {
      const q = searchValue.trim();
      if (!q) {
        setSuggestions(null);
        return;
      }

      const controller = new AbortController();
      const t = setTimeout(async () => {
        router.replace(`/search?q=${encodeURIComponent(q)}`);

        try {
          setSuggestLoading(true);
          const params = new URLSearchParams({ q, type: 'all', limit: '5' });
          const res = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal });
          const json = await res.json();
          setSuggestions(json);
        } catch (e) {
          if ((e as any).name !== 'AbortError') {
            // noop
          }
        } finally {
          setSuggestLoading(false);
        }
      }, 300);

      return () => {
        clearTimeout(t);
        controller.abort();
      };
    }, [searchValue, router]);
    
    const handleSignOut = async () => {
      const { error } = await authClient.signOut();
      if (error?.code) {
        toast.error(error.code);
      } else {
        localStorage.removeItem("admin_token");
        refetch();
        router.push("/");
      }
    };

    // Hide navigation on Android - check at the end after all hooks
    if (isAndroid) {
      return null;
    }

    return (
        <nav className="sticky top-0 z-50 flex items-center justify-between bg-black px-4 py-3 sm:px-6">
            {/* Left Section */}
            <div className="flex-1 flex justify-start">
               <div className="flex items-center gap-4">
                 <Link href="/" className="flex items-center gap-2">
                   <UniSinLogo className="h-8 w-8 text-white" />
                   <span className="text-xl font-bold text-white">UniSin</span>
                 </Link>
               </div>
            </div>

            {/* Center Section */}
            <div className="flex-none flex items-center gap-2 w-[364px]">
                <Link href="/" aria-label="Home" className="p-2 rounded-full bg-black/70 hover:bg-[#1a1a1a] transition-colors">
                    <Home className="h-6 w-6 text-white" />
                </Link>
                 <div className="relative w-full">
                    <button
                        type="button"
                        onClick={goSearch}
                        aria-label="Search"
                        className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 hover:text-white focus:outline-none"
                    >
                        <Search className="h-5 w-5" />
                    </button>
                    <input
                        type="search"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') goSearch(); }}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
                        className="bg-[#242424] h-12 border-2 border-transparent focus:border-white rounded-full w-full pl-10 pr-4 text-white text-sm focus:outline-none"
                    />
                    {showCustomPlaceholder && (
                        <div className="absolute inset-y-0 left-10 right-3 flex justify-between items-center pointer-events-none">
                           <span className="text-muted-foreground text-sm">What do you want to play?</span>
                           <span className="flex items-center gap-1">
                               <kbd className="bg-zinc-700 text-zinc-300 text-[10px] font-sans font-bold py-0.5 px-1.5 rounded-sm">Ctrl</kbd>
                               <kbd className="bg-zinc-700 text-zinc-300 text-[10px] font-sans font-bold py-0.5 px-1.5 rounded-sm">K</kbd>
                           </span>
                       </div>
                    )}
                    {!showCustomPlaceholder && (
                        <button
                          type="button"
                          onClick={() => setSearchValue("")}
                          aria-label="Clear search"
                          className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-400 hover:text-white focus:outline-none"
                        >
                          <X className="h-4 w-4" />
                        </button>
                    )}

                    {/* Suggestions dropdown */}
                    {searchFocused && searchValue.trim() && (
                      <div className="absolute left-0 right-0 top-[110%] z-50 rounded-xl border border-white/10 bg-[#181818] shadow-2xl">
                        <div className="p-3">
                          {suggestLoading && (
                            <p className="text-xs text-white/60 px-1 py-1">Searching…</p>
                          )}
                          {!suggestLoading && suggestions?.type === 'all' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Top result */}
                              <div>
                                <p className="text-sm font-semibold mb-2">Top result</p>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => router.push(`/search?q=${encodeURIComponent(searchValue.trim())}&type=track`)}
                                  className="flex items-center gap-3 w-full text-left rounded-lg bg-[#121212] hover:bg-[#0f0f0f] border border-white/10 p-3"
                                >
                                  {suggestions?.categories?.tracks?.[0]?.imageUrl ? (
                                    <img src={suggestions.categories.tracks[0].imageUrl} alt={suggestions.categories.tracks[0].title}
                                         className="h-14 w-14 rounded object-cover" />
                                  ) : (
                                    <div className="h-14 w-14 rounded bg-[#2a2a2a]" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold truncate">
                                      {suggestions?.categories?.tracks?.[0]?.title || 'Open full results'}
                                    </p>
                                    <p className="text-xs text-white/60">Song • Quick match</p>
                                  </div>
                                </button>
                              </div>

                              {/* Songs list */}
                              <div>
                                <p className="text-sm font-semibold mb-2">Songs</p>
                                <div className="space-y-1">
                                  {(suggestions?.categories?.tracks || []).slice(0, 5).map((t: any) => (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => router.push(`/search?q=${encodeURIComponent(t.title)}`)}
                                      className="w-full flex items-center gap-3 rounded-md px-2 py-2 hover:bg-white/5"
                                    >
                                      {t.imageUrl ? (
                                        <img src={t.imageUrl} alt={t.title} className="h-8 w-8 rounded object-cover" />
                                      ) : (
                                        <div className="h-8 w-8 rounded bg-[#2a2a2a]" />
                                      )}
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium truncate">{t.title}</p>
                                      </div>
                                      <span className="ml-auto text-[10px] text-white/50">{Math.round((t.durationSec||0)/60)}:{String((t.durationSec||0)%60).padStart(2,'0')}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {!suggestLoading && (!suggestions || (suggestions?.type === 'all' && !suggestions?.categories?.tracks?.length)) && (
                            <div className="px-1 py-1 text-xs text-white/60">
                              <p>No quick matches</p>
                              <div className="mt-2">
                                <Link
                                  href={`/creator?title=${encodeURIComponent(searchValue.trim())}`}
                                  className="inline-flex items-center rounded-md bg-[#1db954] text-black font-semibold px-2 py-1 hover:brightness-95"
                                >
                                  Publish it on Unisin
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                 </div>
            </div>

            {/* Right Section */}
            <div className="flex-1 flex justify-end">
              <div className="flex items-center gap-4">
                {!currentUser && (
                  <div className="flex items-center gap-4">
                    <Link href="/download" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white hover:scale-105 transition">
                      <Download className="h-5 w-5" />
                      <span>Install App</span>
                    </Link>
                    <Link href="/register" className="text-sm font-bold text-muted-foreground hover:text-white hover:scale-105 transition">Sign up</Link>
                    <Link href="/login" className="bg-white text-black text-base font-bold rounded-full px-8 py-3 hover:scale-105 transition">Log in</Link>
                  </div>
                )}

                {currentUser && (
                  <div className="flex items-center gap-3">
                    {/* Editor Panel Link - Show only if user has editor or admin role */}
                    {userRole?.isEditor && (
                      <Link
                        href="/editor"
                        prefetch={false}
                        className="hidden sm:flex items-center gap-2 rounded-full bg-[#282828] px-4 py-2 text-sm font-semibold text-white hover:bg-[#333] transition"
                      >
                        <Settings className="h-4 w-4" />
                        Editor
                      </Link>
                    )}
                    
                    {/* Admin Panel Link - Show only if user has admin role */}
                    {userRole?.isAdmin && (
                      <Link
                        href="/admin/moderation"
                        prefetch={false}
                        className="hidden sm:flex items-center gap-2 rounded-full bg-[#282828] px-4 py-2 text-sm font-semibold text-white hover:bg-[#333] transition"
                      >
                        <Settings className="h-4 w-4" />
                        Admin
                      </Link>
                    )}
                    
                    <Link href="/download" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white hover:scale-105 transition">
                      <Download className="h-5 w-5" />
                      <span>Install App</span>
                    </Link>
                    <button aria-label="Notifications" className="p-2 rounded-full hover:bg-[#1a1a1a] transition-colors">
                      <Bell className="h-5 w-5 text-white" />
                    </button>
                    <button aria-label="Friends Activity" className="p-2 rounded-full hover:bg-[#1a1a1a] transition-colors">
                      <Users className="h-5 w-5 text-white" />
                    </button>
                    <Link href="/profile" aria-label="Profile" className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2a2a2a] text-sm font-bold hover:bg-[#333] transition-colors">
                      {currentUser.name?.charAt(0).toUpperCase() || "U"}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="ml-2 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:border-white/40"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
        </nav>
    );
};

export default TopNavigation;
