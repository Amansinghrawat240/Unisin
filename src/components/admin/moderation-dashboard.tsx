"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface QueueItem {
  id: number;
  type?: string;
  kind?: string;
  status?: string;
  createdAt?: string | number | null;
  [key: string]: any;
}

const storage = {
  get token() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("admin_token") || "";
  },
  set token(v: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("admin_token", v);
  },
  get email() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("admin_email") || "";
  },
  set email(v: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("admin_email", v);
  },
};

const api = async (path: string, options: RequestInit & { token: string; email: string }) => {
  const { token, email, ...rest } = options;
  const res = await fetch(path, {
    ...rest,
    headers: {
      "Authorization": `Bearer ${token}`,
      "x-test-user-email": email,
      // ensure backend gets a stable moderator user id (use email)
      "x-test-user-id": email,
      "Content-Type": "application/json",
      ...(rest.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
};

// Helper: Try to derive a playable preview URL for audio submissions
const gdriveToDirect = (url?: string) => {
  if (!url) return "";
  // Accept already-direct uc? links
  if (url.includes("uc?export=download") || url.includes("uc?id=")) return url;
  // Match share/view links: https://drive.google.com/file/d/<ID>/view?usp=sharing
  const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (m?.[1]) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
  return url;
};

// NEW: Dropbox share link -> direct content host
const dropboxToDirect = (url?: string) => {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("dropbox.com")) {
      u.hostname = "dl.dropboxusercontent.com";
      u.searchParams.delete("dl");
      u.searchParams.delete("raw");
      return u.toString();
    }
  } catch {}
  return url;
};

// NEW: Unified converter for common providers
const toDirect = (url?: string) => {
  if (!url) return "";
  const g = gdriveToDirect(url);
  const d = dropboxToDirect(g);
  return d;
};

const getPreviewUrl = (item: QueueItem) => {
  const p = item.payload || {};
  // Prefer explicit audioUrl/previewUrl, fallback to originalUrl (convert common providers)
  const direct = p.audioUrl || p.previewUrl || p.streamUrl || p.playbackUrl;
  if (direct) return String(direct);
  if (p.originalUrl) return toDirect(String(p.originalUrl));
  return "";
};

// NEW: helpers for moderation state handling (tracks)
const getTrackState = (item: QueueItem) => (item.status || item.state || item?.payload?.state || "").toLowerCase();
const TRACK_ALLOWED_STATES = ["submitted", "needs_review", "processing"] as const;
const canActOnTrack = (state: string) => TRACK_ALLOWED_STATES.includes(state as any);

// NEW: add prop to control which queue to show
export interface AdminModerationDashboardProps {
  mode?: "creators" | "music" | "all";
}

export default function AdminModerationDashboard({ mode = "all" }: AdminModerationDashboardProps) {
  const pathname = usePathname();
  
  // All hooks must be called before any early returns
  const [email, setEmail] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [openDetails, setOpenDetails] = useState<Record<number, boolean>>({});
  const [autoApproveEnabled, setAutoApproveEnabled] = useState<boolean>(false);
  const [savingSetting, setSavingSetting] = useState<boolean>(false);
  const [editingArtistId, setEditingArtistId] = useState<number | null>(null);
  const [editingArtistValue, setEditingArtistValue] = useState<string>("");
  const [savingArtist, setSavingArtist] = useState(false);

  // CRITICAL: Only allow fetching when on admin routes
  const isOnAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    setEmail(storage.email);
    setToken(storage.token);
  }, []);

  // NEW: react to admin_token/admin_email being minted elsewhere (TopNavigation) without manual refresh
  useEffect(() => {
    const sync = () => {
      setEmail(localStorage.getItem("admin_email") || "");
      setToken(localStorage.getItem("admin_token") || "");
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const isReady = useMemo(() => Boolean(token && email && isOnAdminRoute), [token, email, isOnAdminRoute]);

  const fetchQueue = async () => {
    // CRITICAL: Double-check route before making ANY API call
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/admin')) {
        console.log('[AdminModerationDashboard] Blocked queue fetch - not on admin route:', currentPath);
        return;
      }
    }
    
    if (!isReady) return;
    try {
      setLoading(true);
      const data = await api("/api/v1/moderation/queue", { method: "GET", token, email });
      setQueue(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  // NEW: load and toggle auto-approve setting (only relevant for creators)
  const fetchAutoApprove = async () => {
    // CRITICAL: Double-check route before making ANY API call
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/admin')) {
        console.log('[AdminModerationDashboard] Blocked auto-approve fetch - not on admin route:', currentPath);
        return;
      }
    }
    
    if (!isReady) return;
    try {
      const data = await api("/api/v1/admin/settings/auto-approve", { method: "GET", token, email });
      setAutoApproveEnabled(!!data?.enabled);
    } catch (e: any) {
      // silent
    }
  };

  const toggleAutoApprove = async () => {
    if (!isReady || savingSetting) return;
    try {
      setSavingSetting(true);
      const next = !autoApproveEnabled;
      setAutoApproveEnabled(next); // optimistic
      await api("/api/v1/admin/settings/auto-approve", {
        method: "POST",
        body: JSON.stringify({ enabled: next }),
        token,
        email,
      });
      toast.success(`Auto-approve ${next ? "enabled" : "disabled"}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update setting");
      await fetchAutoApprove(); // rollback
    } finally {
      setSavingSetting(false);
    }
  };

  const approve = async (id: number) => {
    try {
      // optimistic update
      setQueue((prev) => prev.map((it) => (it.id === id ? { ...it, status: "live", state: "live", payload: { ...(it as any).payload, state: "live" } } : it)));
      await api(`/api/v1/moderation/${id}/accept`, { method: "POST", token, email });
      toast.success(`Approved #${id}`);
      await fetchQueue();
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve");
      // rollback on error
      await fetchQueue();
    }
  };

  const reject = async (id: number, reason: string) => {
    try {
      // optimistic update
      setQueue((prev) => prev.map((it) => (it.id === id ? { ...it, status: "rejected", state: "rejected", payload: { ...(it as any).payload, state: "rejected", rejectionReason: reason } } : it)));
      await api(`/api/v1/moderation/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }), token, email });
      toast.success(`Rejected #${id}`);
      setRejectingId(null);
      setRejectReason("");
      await fetchQueue();
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject");
      // rollback on error
      await fetchQueue();
    }
  };

  // NEW: reopen track (from rejected/live -> needs_review)
  const reopen = async (id: number) => {
    try {
      // optimistic update
      setQueue((prev) => prev.map((it) => (it.id === id ? { ...it, status: "needs_review", state: "needs_review", payload: { ...(it as any).payload, state: "needs_review", rejectionReason: undefined } } : it)));
      await api(`/api/v1/moderation/${id}/reopen`, { method: "POST", token, email });
      toast.success(`Reopened #${id} to needs_review`);
      await fetchQueue();
    } catch (e: any) {
      toast.error(e?.message || "Failed to reopen");
      // rollback on error
      await fetchQueue();
    }
  };

  // NEW: creator application actions
  const approveCreator = async (id: number) => {
    try {
      await api(`/api/v1/admin/creators/${id}/approve`, { method: "POST", body: JSON.stringify({}), token, email });
      toast.success(`Creator #${id} approved`);
      await fetchQueue();
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve creator");
    }
  };

  const rejectCreator = async (id: number, reason: string) => {
    try {
      await api(`/api/v1/admin/creators/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }), token, email });
      toast.success(`Creator #${id} rejected`);
      setRejectingId(null);
      setRejectReason("");
      await fetchQueue();
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject creator");
    }
  };

  const saveArtistName = async (id: number, newArtists: string) => {
    if (!isReady || savingArtist) return;
    try {
      setSavingArtist(true);
      // Update the track submission's artistsCsv field
      await api(`/api/v1/moderation/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ artistsCsv: newArtists }),
        token,
        email,
      });
      toast.success("Artist name updated");
      setEditingArtistId(null);
      setEditingArtistValue("");
      await fetchQueue();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update artist name");
    } finally {
      setSavingArtist(false);
    }
  };

  useEffect(() => {
    // CRITICAL: Early return if not on admin route
    if (!isOnAdminRoute) {
      return;
    }
    
    fetchQueue();
    // only fetch auto-approve when creators view is used
    if (mode === "creators" || mode === "all") fetchAutoApprove();
  }, [token, email, mode, isOnAdminRoute]);

  // NEW: filtered queue based on mode
  const filteredQueue = useMemo(() => {
    if (mode === "creators") return queue.filter((i) => i.kind === "creator_application");
    if (mode === "music") return queue.filter((i) => i.kind === "track_submission");
    return queue;
  }, [queue, mode]);
  
  // CRITICAL: Prevent any rendering if not on admin route - AFTER all hooks
  if (!pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Gate: require admin login */}
      {!isReady && (
        <div className="rounded-xl border border-white/10 bg-[#181818]/80 p-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-white/80">Admin access required.</p>
            <p className="text-xs text-white/60">Please sign in with an approved Gmail and password.</p>
            <div className="pt-2">
              <Link href="/admin/login" className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-black hover:brightness-95">
                Go to Admin Login
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Queue */}
      {isReady && (
        <div className="rounded-xl border border-white/10 bg-[#181818]/80">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h2 className="text-lg font-semibold">
              {mode === "creators" ? "Creator Moderation" : mode === "music" ? "Music Moderation" : "Moderation Queue"}
            </h2>
            <div className="flex items-center gap-3">
              {/* Auto-approve toggle only for creators view */}
              {mode === "creators" && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span>Auto-approve creators</span>
                  <button
                    onClick={toggleAutoApprove}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${autoApproveEnabled ? "bg-white" : "bg-white/20"}`}
                    title="Toggle auto-approve for creator applications"
                    aria-pressed={autoApproveEnabled}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-black transition ${autoApproveEnabled ? "translate-x-5" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              )}
              <button
                onClick={fetchQueue}
                disabled={loading}
                className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:border-white/40 disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {filteredQueue.length === 0 && !loading && (
            <div className="p-6 text-sm text-white/70">No items in queue.</div>
          )}

          <ul className="divide-y divide-white/5">
            {filteredQueue.map((item) => (
              <li key={item.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-white/90 font-medium">Request #{item.id}</div>
                    <div className="text-xs text-white/60">
                      {item.type || item.kind || "submission"} • {(item.status || item.state || "pending")}
                    </div>
                    {/* Track metadata with editable artist name */}
                    {item.kind === "track_submission" && (
                      <div className="text-xs text-white/70">
                        <span className="text-white/80 font-semibold">{item?.payload?.title || "Untitled"}</span>
                        {item?.payload?.artistsCsv && (
                          <>
                            <span className="text-white/60"> — </span>
                            {editingArtistId === item.id ? (
                              <span className="inline-flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingArtistValue}
                                  onChange={(e) => setEditingArtistValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      saveArtistName(item.id, editingArtistValue);
                                    } else if (e.key === "Escape") {
                                      setEditingArtistId(null);
                                      setEditingArtistValue("");
                                    }
                                  }}
                                  className="inline-block w-48 rounded bg-[#242424] px-2 py-0.5 text-xs outline-none border border-white/20 focus:border-white/40"
                                  autoFocus
                                />
                                <button
                                  onClick={() => saveArtistName(item.id, editingArtistValue)}
                                  disabled={savingArtist}
                                  className="text-[10px] text-white/80 hover:text-white underline disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingArtistId(null);
                                    setEditingArtistValue("");
                                  }}
                                  className="text-[10px] text-white/60 hover:text-white/80"
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingArtistId(item.id);
                                  setEditingArtistValue(item.payload.artistsCsv);
                                }}
                                className="text-white/70 hover:text-white/90 underline decoration-dotted"
                                title="Click to edit artist name"
                              >
                                {item.payload.artistsCsv}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {/* Applicant details for creator applications */}
                    {item.kind === "creator_application" && (
                      <div className="text-xs text-white/70">
                        <span className="text-white/80 font-semibold">{item?.payload?.displayName || "Unnamed"}</span>
                        {item?.payload?.email && (
                          <span className="text-white/60"> — {item.payload.email}</span>
                        )}
                        {item?.payload?.country && (
                          <span className="text-white/50"> • {item.payload.country}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.kind === "creator_application" ? (
                      // Only show in creators mode
                      mode === "creators" ? (
                        <>
                          <button
                            onClick={() => approveCreator(item.id)}
                            className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-black hover:brightness-95"
                          >
                            Approve
                          </button>
                          {rejectingId === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason"
                                className="w-40 rounded-md bg-[#242424] px-2 py-1.5 text-xs outline-none border border-white/10 focus:border-white/30"
                              />
                              <button
                                onClick={() => rejectCreator(item.id, rejectReason)}
                                className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:border-white/40"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => { setRejectingId(null); setRejectReason(""); }}
                                className="rounded-md border border-transparent px-3 py-1.5 text-xs text-white/60 hover:text-white/80"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setRejectingId(item.id); setRejectReason(""); }}
                              className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:border-white/40"
                            >
                              Reject
                            </button>
                          )}
                        </>
                      ) : null
                    ) : (
                      // Track actions only in music mode
                      mode === "music" ? (
                        <>
                          {(() => {
                            const state = getTrackState(item);
                            const disabled = !canActOnTrack(state);
                            return (
                              <button
                                onClick={() => !disabled && approve(item.id)}
                                disabled={disabled}
                                title={disabled ? "Cannot approve in current state" : "Approve and publish"}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${disabled ? "bg-white/20 text-white/60 cursor-not-allowed" : "bg-white text-black hover:brightness-95"}`}
                              >
                                Approve
                              </button>
                            );
                          })()}
                          {rejectingId === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason"
                                className="w-40 rounded-md bg-[#242424] px-2 py-1.5 text-xs outline-none border border-white/10 focus:border-white/30"
                              />
                              {(() => {
                                const state = getTrackState(item);
                                const disabled = !canActOnTrack(state) || !rejectReason.trim();
                                return (
                                  <button
                                    onClick={() => !disabled && reject(item.id, rejectReason)}
                                    disabled={disabled}
                                    title={!canActOnTrack(state) ? "Cannot reject in current state" : (!rejectReason.trim() ? "Add a reason to reject" : "Confirm reject")}
                                    className={`rounded-md border px-3 py-1.5 text-xs ${disabled ? "border-white/10 text-white/40 cursor-not-allowed" : "border-white/20 text-white/80 hover:text-white hover:border-white/40"}`}
                                  >
                                    Confirm
                                  </button>
                                );
                              })()}
                              <button
                                onClick={() => { setRejectingId(null); setRejectReason(""); }}
                                className="rounded-md border border-transparent px-3 py-1.5 text-xs text-white/60 hover:text-white/80"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            (() => {
                              const state = getTrackState(item);
                              const disabled = !canActOnTrack(state);
                              return (
                                <button
                                  onClick={() => { if (!disabled) { setRejectingId(item.id); setRejectReason(""); } }}
                                  disabled={disabled}
                                  title={disabled ? "Cannot reject in current state" : "Add a rejection reason"}
                                  className={`rounded-md border px-3 py-1.5 text-xs ${disabled ? "border-white/10 text-white/40 cursor-not-allowed" : "border-white/20 text-white/80 hover:text-white hover:border-white/40"}`}
                                >
                                  Reject
                                </button>
                              );
                            })()
                          )}
                          {(() => {
                            const state = getTrackState(item);
                            const showReopen = state === "rejected" || state === "live";
                            if (!showReopen) return null;
                            return (
                              <button
                                onClick={() => reopen(item.id)}
                                title={state === "rejected" ? "Move back to needs_review" : "Unpublish and move to needs_review"}
                                className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:border-white/40"
                              >
                                {state === "live" ? "Unpublish (Reopen)" : "Reopen"}
                              </button>
                            );
                          })()}
                        </>
                      ) : null
                    )}
                  </div>
                </div>

                {/* Inline audio preview for track submissions (only show in music mode) */}
                {mode === "music" && item.kind === "track_submission" && (
                  <div className="mt-3 rounded-md bg-black/30 p-3">
                    {getPreviewUrl(item) ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-white/70">
                            Preview • {item?.payload?.sourceType || "external"}
                          </div>
                          <button
                            onClick={() => setOpenDetails((s) => ({ ...s, [item.id]: !s[item.id] }))}
                            className="text-[11px] text-white/60 hover:text-white/80"
                          >
                            {openDetails[item.id] ? "Hide details" : "Show details"}
                          </button>
                        </div>
                        <audio
                          controls
                          preload="none"
                          src={getPreviewUrl(item)}
                          className="w-full h-10 rounded-md"
                        />
                        {item?.payload?.originalUrl && (
                          <div className="text-[11px] text-white/50 truncate">Source: {String(item.payload.originalUrl)}</div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-white/60">No playable audio URL provided.</div>
                        <button
                          onClick={() => setOpenDetails((s) => ({ ...s, [item.id]: !s[item.id] }))}
                          className="text-[11px] text-white/60 hover:text-white/80"
                        >
                          {openDetails[item.id] ? "Hide details" : "Show details"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Raw payload preview (collapsible) */}
                {openDetails[item.id] && (
                  <pre className="mt-3 overflow-x-auto rounded-md bg-black/30 p-3 text-xs text-white/70">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
