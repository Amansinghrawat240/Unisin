"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";

export type PlayerTrack = {
  id?: string | number;
  title: string;
  artists: string[];
  imageUrl: string;
  audioUrl: string; // must be a playable mp3/ogg url
};

type PlayerContextType = {
  queue: PlayerTrack[];
  currentIndex: number;
  current: PlayerTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0..1
  muted: boolean;
  setQueue: (tracks: PlayerTrack[], startIndex?: number) => void;
  playTrack: (track: PlayerTrack, replaceQueue?: boolean) => void;
  playFromQueue: (tracks: PlayerTrack[], startIndex: number) => void;
  addToQueue: (track: PlayerTrack) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // CRITICAL FIX: Call getInitialSnapshot only once and store in ref
  const initialSnapshotRef = useRef<any>(null);
  if (initialSnapshotRef.current === null && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("player_state");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed) {
        const isAndroid = /Android/i.test(navigator.userAgent);
        const isWebView = /wv/.test(navigator.userAgent);
        console.log("🔍 Player Initial State:", {
          currentIndex: parsed.currentIndex,
          queueLength: parsed.queue?.length,
          currentTrack: parsed.queue?.[parsed.currentIndex]?.title,
          isPlaying: parsed.isPlaying,
          isAndroid,
          isWebView,
          userAgent: navigator.userAgent.substring(0, 50),
        });
        
        // Android WebView validation
        if (isAndroid && Array.isArray(parsed.queue) && typeof parsed.currentIndex === "number") {
          if (parsed.currentIndex < 0 || parsed.currentIndex >= parsed.queue.length) {
            console.warn("⚠️ Invalid currentIndex detected on Android, resetting to 0");
            parsed.currentIndex = 0;
          }
          if (!parsed.queue[parsed.currentIndex]) {
            console.warn("⚠️ Track at currentIndex missing on Android, resetting to 0");
            parsed.currentIndex = 0;
          }
        }
      }
      initialSnapshotRef.current = parsed || {};
    } catch {
      initialSnapshotRef.current = {};
    }
  }

  const [queue, setQueueState] = useState<PlayerTrack[]>(() => 
    Array.isArray(initialSnapshotRef.current?.queue) ? initialSnapshotRef.current.queue : []
  );
  const [currentIndex, setCurrentIndex] = useState<number>(() => 
    typeof initialSnapshotRef.current?.currentIndex === "number" ? initialSnapshotRef.current.currentIndex : -1
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(() => 
    typeof initialSnapshotRef.current?.isPlaying === "boolean" ? initialSnapshotRef.current.isPlaying : false
  );
  const [currentTime, setCurrentTime] = useState<number>(() => 
    typeof initialSnapshotRef.current?.currentTime === "number" ? initialSnapshotRef.current.currentTime : 0
  );
  const [duration, setDuration] = useState<number>(() => 
    typeof initialSnapshotRef.current?.duration === "number" ? initialSnapshotRef.current.duration : 0
  );
  const [volume, setVolumeState] = useState<number>(() => 
    typeof initialSnapshotRef.current?.volume === "number" ? initialSnapshotRef.current.volume : 0.8
  );
  const [muted, setMuted] = useState<boolean>(() => 
    typeof initialSnapshotRef.current?.muted === "boolean" ? initialSnapshotRef.current.muted : false
  );
  // rAF ticker to keep UI progress in sync even if timeupdate is sparse
  const rafRef = useRef<number | null>(null);

  // Cross-tab sync
  const tabIdRef = useRef<string>(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  const isLeaderRef = useRef<boolean>(true); // Start as leader by default for single-tab scenario
  const [isLeader, setIsLeader] = useState(true); // Initialize as leader
  const heartbeatRef = useRef<number | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const LS_LEADER_KEY = "player_leader"; // { id: string, ts: number }
  const LS_STATE_KEY = "player_state";
  // follower-side smooth progress when mirroring another tab
  const followerRafRef = useRef<number | null>(null);
  const followerLastTsRef = useRef<number | null>(null);
  const takeoverPendingRef = useRef<boolean>(false);

  // Track pending operations to prevent overlapping play() calls
  const loadingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Debounce play/pause to prevent rapid toggling
  const playPauseDebounceRef = useRef<number | null>(null);
  const lastPlayPauseRef = useRef<number>(0);
  const PLAY_PAUSE_DEBOUNCE = 300; // 300ms debounce

  // Make safe duration helper available everywhere (listeners + loadAndPlay)
  const getSafeDuration = () => {
    const el = audioRef.current;
    if (!el) return 0;
    const d = el.duration;
    if (Number.isFinite(d) && d > 0) return d;
    const r = el.seekable;
    if (r && r.length > 0) {
      const end = r.end(r.length - 1);
      if (Number.isFinite(end) && end > 0) return end;
    }
    const b = el.buffered;
    if (b && b.length > 0) {
      const end = b.end(b.length - 1);
      if (Number.isFinite(end) && end > 0) return end;
    }
    return 0;
  };

  // Throttle state saves to prevent performance issues
  const lastSaveRef = useRef<number>(0);
  const SAVE_THROTTLE_MS = 1000; // Only save once per second during playback

  const saveState = (override?: Partial<Record<string, any>>, force = false) => {
    try {
      const now = Date.now();
      // Throttle saves unless forced (e.g., user actions like pause/play/seek)
      if (!force && now - lastSaveRef.current < SAVE_THROTTLE_MS) return;
      lastSaveRef.current = now;

      const snapshot = {
        queue,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        muted,
        ts: now,
        ...override,
      };
      localStorage.setItem(LS_STATE_KEY, JSON.stringify(snapshot));
      if (bcRef.current) bcRef.current.postMessage({ type: "STATE", payload: snapshot });
    } catch {}
  };

  // Leader election + BroadcastChannel setup
  useEffect(() => {
    // Setup BroadcastChannel
    try {
      bcRef.current = new BroadcastChannel("player_sync");
      // follower progress ticker
      const startFollowerTick = () => {
        if (followerRafRef.current) return;
        followerLastTsRef.current = performance.now();
        const step = (now: number) => {
          const last = followerLastTsRef.current ?? now;
          const dt = Math.max(0, (now - last) / 1000);
          followerLastTsRef.current = now;
          // Only advance when mirroring another tab (not leader) and supposed to be playing
          if (!isLeaderRef.current && isPlaying && duration > 0) {
            setCurrentTime((t) => Math.min(t + dt, duration));
          }
          followerRafRef.current = requestAnimationFrame(step);
        };
        followerRafRef.current = requestAnimationFrame(step);
      };
      const stopFollowerTick = () => {
        if (followerRafRef.current) {
          cancelAnimationFrame(followerRafRef.current);
          followerRafRef.current = null;
        }
      };

      bcRef.current.onmessage = (e: MessageEvent) => {
        const { type, payload } = e.data || {};
        if (type === "STATE" && !isLeaderRef.current && payload) {
          // Follow leader state without triggering playback
          if (Array.isArray(payload.queue)) setQueueState(payload.queue);
          if (typeof payload.currentIndex === "number") setCurrentIndex(payload.currentIndex);
          if (typeof payload.isPlaying === "boolean") setIsPlaying(payload.isPlaying);
          if (typeof payload.duration === "number") setDuration(payload.duration);
          if (typeof payload.volume === "number") setVolumeState(payload.volume);
          if (typeof payload.muted === "boolean") setMuted(payload.muted);
          if (typeof payload.currentTime === "number" && typeof payload.ts === "number") {
            const now = Date.now();
            const drift = Math.max(0, (now - payload.ts) / 1000);
            const mirrored = payload.isPlaying ? payload.currentTime + drift : payload.currentTime;
            setCurrentTime(mirrored);
          }
          // Control follower local ticking based on leader play state
          if (payload?.isPlaying) startFollowerTick(); else stopFollowerTick();
        }
      };

      // Cleanup follower ticker when channel is disposed
      const cleanupFollower = () => {
        if (followerRafRef.current) cancelAnimationFrame(followerRafRef.current);
        followerRafRef.current = null;
      };
      // Attach to instance so we can call in return
      (bcRef.current as any)._cleanupFollower = cleanupFollower;
    } catch {}

    const claimLeadership = () => {
      try {
        const raw = localStorage.getItem(LS_LEADER_KEY);
        const now = Date.now();
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || !parsed.id || typeof parsed.ts !== "number" || now - parsed.ts > 3000) {
          localStorage.setItem(LS_LEADER_KEY, JSON.stringify({ id: tabIdRef.current, ts: now }));
        }
        const check = JSON.parse(localStorage.getItem(LS_LEADER_KEY) || "{}");
        isLeaderRef.current = check.id === tabIdRef.current;
        setIsLeader(isLeaderRef.current);
      } catch {
        isLeaderRef.current = true; // fallback: single-tab
        setIsLeader(true);
      }
    };

    claimLeadership();

    // Immediately share existing snapshot without clobbering persisted state
    try {
      const rawState = localStorage.getItem(LS_STATE_KEY);
      if (rawState) {
        const snapshot = JSON.parse(rawState);
        bcRef.current?.postMessage({ type: "STATE", payload: snapshot });
      } else if (queue.length > 0 || currentIndex >= 0) {
        // Only write if we actually have something meaningful
        saveState();
      }
    } catch {}

    // Heartbeat if leader; re-check regularly
    const interval = window.setInterval(() => {
      try {
        const now = Date.now();
        const raw = localStorage.getItem(LS_LEADER_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed?.id === tabIdRef.current) {
          // I am leader -> heartbeat
          localStorage.setItem(LS_LEADER_KEY, JSON.stringify({ id: tabIdRef.current, ts: now }));
          isLeaderRef.current = true;
          setIsLeader(true);
        } else if (!parsed || now - parsed.ts > 3000) {
          // Leader stale -> take over
          localStorage.setItem(LS_LEADER_KEY, JSON.stringify({ id: tabIdRef.current, ts: now }));
          isLeaderRef.current = true;
          setIsLeader(true);
        } else {
          isLeaderRef.current = false;
          setIsLeader(false);
        }
      } catch {}
    }, 1000);
    heartbeatRef.current = interval as unknown as number;

    const onBeforeUnload = () => {
      try {
        const raw = localStorage.getItem(LS_LEADER_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed?.id === tabIdRef.current) {
          localStorage.removeItem(LS_LEADER_KEY);
        }
      } catch {}
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
      try { (bcRef.current as any)?._cleanupFollower?.(); bcRef.current?.close(); } catch {}
    };
  }, []);

  // Keep latest queue for event handlers
  const latestQueueRef = useRef<PlayerTrack[]>([]);
  useEffect(() => {
    latestQueueRef.current = queue;
  }, [queue]);

  // Keep latest index for stable event handlers (e.g., "ended")
  const latestIndexRef = useRef<number>(-1);
  useEffect(() => {
    latestIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Ensure a single audio element with stable listeners (run once)
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata"; // Changed from "auto" to reduce initial buffering
      audioRef.current.crossOrigin = null as any;
      audioRef.current.volume = volume;

      const tick = () => {
        if (!audioRef.current) return;
        setCurrentTime(audioRef.current.currentTime || 0);
        rafRef.current = requestAnimationFrame(tick);
        // Throttled save - only once per second instead of 60 times
        if (isLeaderRef.current) saveState();
      };

      const onTime = () => {
        const el = audioRef.current!;
        setCurrentTime(el.currentTime || 0);
        const maybe = getSafeDuration();
        if (maybe && maybe !== duration) setDuration(maybe);
        // Remove frequent saveState call here - handled by throttled tick
      };
      const onLoaded = () => { 
        setDuration(getSafeDuration()); 
        if (isLeaderRef.current) saveState(undefined, true); // Force save on load
      };
      const onDurationChange = () => { 
        setDuration(getSafeDuration()); 
        if (isLeaderRef.current) saveState(undefined, true); // Force save on duration change
      };
      const onEnd = () => {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        const q = latestQueueRef.current;
        if (!q || q.length === 0) return;
        const ci = latestIndexRef.current ?? -1;
        const ni = (ci + 1) % q.length;
        
        // Debug logging for autoplay
        console.log("🎵 Track Ended - Autoplay Debug:", {
          queueLength: q.length,
          currentIndex: ci,
          nextIndex: ni,
          currentTrack: q[ci]?.title,
          nextTrack: q[ni]?.title,
          willLoop: ni === ci,
        });
        
        setCurrentIndex(ni);
        saveState({ currentIndex: ni }, true);
        const nextTrack = q[ni];
        if (nextTrack) {
          void loadAndPlay(nextTrack, { startTime: 0, shouldPlay: true, force: true });
        }
      };
      const onPlay = () => {
        setIsPlaying(true);
        if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
        if (isLeaderRef.current) saveState({ isPlaying: true }, true); // Force save on play
      };
      const onPause = () => {
        setIsPlaying(false);
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        if (isLeaderRef.current) saveState({ isPlaying: false }, true); // Force save on pause
      };

      audioRef.current.addEventListener("timeupdate", onTime);
      audioRef.current.addEventListener("loadedmetadata", onLoaded);
      audioRef.current.addEventListener("loadeddata", onLoaded);
      audioRef.current.addEventListener("canplay", onLoaded);
      audioRef.current.addEventListener("canplaythrough", onLoaded);
      audioRef.current.addEventListener("durationchange", onDurationChange);
      audioRef.current.addEventListener("ended", onEnd);
      audioRef.current.addEventListener("play", onPlay);
      audioRef.current.addEventListener("pause", onPause);

      return () => {
        if (!audioRef.current) return;
        audioRef.current.removeEventListener("timeupdate", onTime);
        audioRef.current.removeEventListener("loadedmetadata", onLoaded);
        audioRef.current.removeEventListener("loadeddata", onLoaded);
        audioRef.current.removeEventListener("canplay", onLoaded);
        audioRef.current.removeEventListener("canplaythrough", onLoaded);
        audioRef.current.removeEventListener("durationchange", onDurationChange);
        audioRef.current.removeEventListener("ended", onEnd);
        audioRef.current.removeEventListener("play", onPlay);
        audioRef.current.removeEventListener("pause", onPause);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
  }, []);

  const current = useMemo(() => (currentIndex >= 0 ? queue[currentIndex] : null), [queue, currentIndex]);

  const loadAndPlay = async (track: PlayerTrack, opts?: { startTime?: number; shouldPlay?: boolean; force?: boolean }) => {
    if (!audioRef.current) return;
    if (!track?.audioUrl) {
      setIsPlaying(false);
      return;
    }
    
    // Abort any pending operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Wait if another load is in progress
    while (loadingRef.current) {
      await new Promise(resolve => setTimeout(resolve, 50));
      if (signal.aborted) return;
    }
    
    loadingRef.current = true;
    
    try {
      // Wait for any pending play promises to settle before pausing
      try {
        if (!audioRef.current.paused) {
          await audioRef.current.pause();
        }
      } catch (e: any) {
        // Ignore pause errors
      }
      
      if (signal.aborted) return;
      
      let srcChanged = false;
      // robust compare: audio element resolves to absolute URL; track.audioUrl may be relative
      const currentSrc = audioRef.current.src || "";
      const targetSrc = track.audioUrl || "";
      const sameSrc = currentSrc === targetSrc || (currentSrc && targetSrc && currentSrc.endsWith(targetSrc));
      if (!sameSrc) {
        setCurrentTime(0);
        setDuration(0);
        audioRef.current.src = targetSrc;
        audioRef.current.load();
        srcChanged = true;
      } else if (opts?.force) {
        // Even if src is the same (e.g., shared demo URL), treat as a new track switch
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
      
      if (signal.aborted) return;
      
      // Ensure metadata is ready so duration is known (with timeout safeguard)
      if (srcChanged && audioRef.current.readyState < 1) {
        await new Promise<void>((resolve) => {
          const el = audioRef.current!;
          const done = () => { el.removeEventListener("loadedmetadata", done); resolve(); };
          const to = window.setTimeout(() => { el.removeEventListener("loadedmetadata", done); resolve(); }, 1000);
          el.addEventListener("loadedmetadata", () => { window.clearTimeout(to); done(); }, { once: true } as any);
        });
        setDuration(getSafeDuration());
      }
      
      if (signal.aborted) return;
      
      if (typeof opts?.startTime === "number") {
        audioRef.current.currentTime = Math.max(0, opts.startTime);
        setCurrentTime(audioRef.current.currentTime);
      }
      const playIt = opts?.shouldPlay ?? isLeaderRef.current;
      if (playIt) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (playErr: any) {
          if (playErr?.name !== "AbortError" && playErr?.name !== "NotAllowedError") {
            console.warn("Playback error:", playErr);
          }
          if (playErr?.name === "NotAllowedError") {
            setIsPlaying(false);
          }
        }
      }
      saveState(undefined, true); // Force save after load
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setIsPlaying(false);
        saveState({ isPlaying: false }, true);
      }
    } finally {
      loadingRef.current = false;
    }
  };

  const setQueue = (tracks: PlayerTrack[], startIndex = 0) => {
    setQueueState(tracks);
    setCurrentIndex(Math.min(Math.max(0, startIndex), tracks.length - 1));
    saveState({ queue: tracks, currentIndex: Math.min(Math.max(0, startIndex), tracks.length - 1) }, true);
  };

  // Remove this problematic useEffect - it competes with the leader takeover effect
  // useEffect(() => {
  //   if (current?.audioUrl) {
  //     loadAndPlay(current);
  //   }
  // }, [current?.audioUrl]);

  // Stop follower ticking whenever this tab is leader or when paused
  useEffect(() => {
    if (!bcRef.current) return;
    const stop = (bcRef.current as any)?._cleanupFollower as (() => void) | undefined;
    if (isLeader || !isPlaying) stop?.();
  }, [isLeader, isPlaying]);

  // When a follower becomes leader (leader tab closed), take over playback
  // CRITICAL: Only depend on [isLeader, current] - NOT currentTime or isPlaying
  // to avoid re-triggering during normal playback
  const hasInitializedLeaderRef = useRef<boolean>(false);
  
  useEffect(() => {
    if (!current) return;
    if (isLeader && !hasInitializedLeaderRef.current) {
      hasInitializedLeaderRef.current = true;
      
      // If state says playing, resume from currentTime; else just load source and stay paused
      (async () => {
        try {
          await loadAndPlay(current, { startTime: currentTime, shouldPlay: isPlaying });
        } catch {}
        // Autoplay policies: if we intended to play but got paused, queue a resume on visibility/user gesture
        if (isPlaying && audioRef.current && audioRef.current.paused) {
          takeoverPendingRef.current = true;
          const tryResume = () => {
            if (!takeoverPendingRef.current) return;
            if (!audioRef.current) return;
            audioRef.current.play().then(() => {
              takeoverPendingRef.current = false;
            }).catch(() => {});
          };
          const onVisibility = () => { if (document.visibilityState === "visible") tryResume(); };
          const onGesture = () => { tryResume(); cleanup(); };
          const cleanup = () => {
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("click", onGesture, { capture: true } as any);
            window.removeEventListener("keydown", onGesture, { capture: true } as any);
            window.removeEventListener("touchstart", onGesture, { capture: true } as any);
          };
          document.addEventListener("visibilitychange", onVisibility);
          window.addEventListener("click", onGesture, { capture: true } as any);
          window.addEventListener("keydown", onGesture, { capture: true } as any);
          window.addEventListener("touchstart", onGesture, { capture: true } as any);
          // safety cleanup after 10s
          setTimeout(() => { takeoverPendingRef.current = false; cleanup(); }, 10000);
        }
      })();
    } else if (!isLeader) {
      hasInitializedLeaderRef.current = false;
    }
  }, [isLeader, current]);

  const playTrack = (track: PlayerTrack, replaceQueue = false) => {
    if (replaceQueue) {
      setQueue([track], 0);
      void loadAndPlay(track, { startTime: 0, shouldPlay: true, force: true });
    } else {
      const idx = queue.findIndex((t) => t.audioUrl === track.audioUrl);
      if (idx !== -1) {
        setCurrentIndex(idx);
        saveState({ currentIndex: idx }, true);
        void loadAndPlay(queue[idx], { startTime: 0, shouldPlay: true, force: true });
      } else {
        const newQueue = [...queue, track];
        setQueueState(newQueue);
        const ni = newQueue.length - 1;
        setCurrentIndex(ni);
        saveState({ queue: newQueue, currentIndex: ni }, true);
        void loadAndPlay(track, { startTime: 0, shouldPlay: true, force: true });
      }
    }
  };

  // Append to play NEXT (insert right after current index). If no current, just enqueue.
  const addToQueue = (track: PlayerTrack) => {
    const exists = queue.some((t) => t.audioUrl === track.audioUrl);
    if (exists) return; // avoid duplicates for simplicity

    if (currentIndex < 0 || queue.length === 0) {
      const newQueue = [...queue, track];
      setQueueState(newQueue);
      setCurrentIndex(0);
      saveState({ queue: newQueue, currentIndex: 0 }, true);
      return;
    }

    const insertAt = Math.min(currentIndex + 1, queue.length);
    const newQueue = [...queue.slice(0, insertAt), track, ...queue.slice(insertAt)];
    setQueueState(newQueue);
    saveState({ queue: newQueue, currentIndex }, true);
  };

  const togglePlay = () => {
    const now = Date.now();
    // Debounce rapid play/pause calls
    if (now - lastPlayPauseRef.current < PLAY_PAUSE_DEBOUNCE) {
      return;
    }
    lastPlayPauseRef.current = now;

    if (!audioRef.current) return;
    const src = audioRef.current.src;
    if (!src && current?.audioUrl) {
      audioRef.current.src = current.audioUrl;
      audioRef.current.load();
    }
    if (!audioRef.current.src) return;

    // Clear any pending debounce
    if (playPauseDebounceRef.current) {
      clearTimeout(playPauseDebounceRef.current);
      playPauseDebounceRef.current = null;
    }

    if (!audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
      saveState({ isPlaying: false }, true);
    } else {
      if (isLeaderRef.current) {
        audioRef.current
          .play()
          .then(() => { setIsPlaying(true); saveState({ isPlaying: true }, true); })
          .catch((err) => { 
            if (err?.name !== "AbortError") {
              setIsPlaying(false); 
              saveState({ isPlaying: false }, true);
            }
          });
      }
    }
  };

  const pause = () => {
    const now = Date.now();
    if (now - lastPlayPauseRef.current < PLAY_PAUSE_DEBOUNCE) {
      return;
    }
    lastPlayPauseRef.current = now;
    
    audioRef.current?.pause();
    saveState({ isPlaying: false }, true);
  };

  const resume = () => {
    const now = Date.now();
    if (now - lastPlayPauseRef.current < PLAY_PAUSE_DEBOUNCE) {
      return;
    }
    lastPlayPauseRef.current = now;
    
    if (isLeaderRef.current && audioRef.current) {
      audioRef.current.play()
        .then(() => saveState({ isPlaying: true }, true))
        .catch((err) => {
          if (err?.name !== "AbortError") {
            saveState({ isPlaying: false }, true);
          }
        });
    }
  };

  const next = () => {
    if (queue.length === 0) return;
    const ni = (currentIndex + 1) % queue.length;
    setCurrentIndex(ni);
    saveState({ currentIndex: ni }, true);
    const track = queue[ni];
    if (track) {
      void loadAndPlay(track, { startTime: 0, shouldPlay: true, force: true });
    }
  };

  const prev = () => {
    if (!audioRef.current) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      saveState({ currentTime: 0 }, true);
      return;
    }
    if (queue.length === 0) return;
    const pi = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(pi);
    saveState({ currentIndex: pi }, true);
    const track = queue[pi];
    if (track) {
      void loadAndPlay(track, { startTime: 0, shouldPlay: true, force: true });
    }
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    const safe = Number.isFinite(duration) && duration > 0
      ? Math.max(0, Math.min(time, duration))
      : Math.max(0, time);
    audioRef.current.currentTime = safe;
    setCurrentTime(safe);
    saveState({ currentTime: safe }, true);
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v === 0 && !muted) {
      audioRef.current!.muted = true;
      setMuted(true);
    } else if (v > 0 && muted) {
      audioRef.current!.muted = false;
      setMuted(false);
    }
    saveState({ volume: v, muted: audioRef.current?.muted ?? muted }, true);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setMuted(audioRef.current.muted);
    saveState({ muted: audioRef.current.muted }, true);
  };

  const playFromQueue = (tracks: PlayerTrack[], startIndex: number) => {
    const safeIndex = Math.min(Math.max(0, startIndex), tracks.length - 1);
    setQueueState(tracks);
    setCurrentIndex(safeIndex);
    saveState({ queue: tracks, currentIndex: safeIndex }, true);
    if (tracks[safeIndex]) {
      void loadAndPlay(tracks[safeIndex], { startTime: 0, shouldPlay: true, force: true });
    }
  };

  const value: PlayerContextType = {
    queue,
    currentIndex,
    current,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    setQueue,
    playTrack,
    playFromQueue,
    addToQueue,
    togglePlay,
    pause,
    resume,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
};