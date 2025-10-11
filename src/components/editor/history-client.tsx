"use client";

import { useEffect, useState } from "react";
import { Undo2, Redo, Clock, Eye } from "lucide-react";
import { toast } from "sonner";

interface Revision {
  id: number;
  actionType: string;
  entityType: string;
  entityId: number;
  previousState: any;
  newState: any;
  isUndone: boolean;
  createdAt: string;
  editor: {
    id: string;
    name: string;
    email: string;
  };
}

export default function HistoryClient() {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoing, setUndoing] = useState<number | null>(null);
  const [redoing, setRedoing] = useState<number | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("bearer_token");
      const adminEmail = localStorage.getItem("admin_email");
      
      if (!token || !adminEmail) {
        toast.error("Please login as admin first");
        window.location.href = "/admin/login";
        return;
      }
      
      loadRevisions();
    };
    
    checkAuth();
  }, []);

  const loadRevisions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      const adminEmail = localStorage.getItem("admin_email");

      const res = await fetch("/api/editor/revisions?limit=50", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-test-user-email": adminEmail || "admin@admin.com",
        },
      });

      if (!res.ok) throw new Error("Failed to load history");

      const data = await res.json();
      setRevisions(data.revisions || []);
    } catch (error) {
      toast.error("Failed to load revision history");
    } finally {
      setLoading(false);
    }
  };

  const undoRevision = async (revisionId: number) => {
    try {
      setUndoing(revisionId);
      const token = localStorage.getItem("bearer_token");
      const adminEmail = localStorage.getItem("admin_email");

      const res = await fetch(`/api/editor/revisions/undo/${revisionId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-test-user-email": adminEmail || "admin@admin.com",
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to undo");
      }

      toast.success("Action undone successfully!");
      loadRevisions();
    } catch (error: any) {
      toast.error(error.message || "Failed to undo action");
    } finally {
      setUndoing(null);
    }
  };

  const redoRevision = async (revisionId: number) => {
    try {
      setRedoing(revisionId);
      const token = localStorage.getItem("bearer_token");
      const adminEmail = localStorage.getItem("admin_email");

      const res = await fetch(`/api/editor/revisions/redo/${revisionId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-test-user-email": adminEmail || "admin@admin.com",
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to redo");
      }

      toast.success("Action redone successfully!");
      loadRevisions();
    } catch (error: any) {
      toast.error(error.message || "Failed to redo action");
    } finally {
      setRedoing(null);
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      section_create: "Created section",
      section_update: "Updated section",
      section_delete: "Deleted section",
      item_add: "Added item",
      item_remove: "Removed item",
      sections_reorder: "Reordered sections",
      items_reorder: "Reordered items",
      artist_delete: "Deleted artist",
      music_edit: "Edited music",
    };
    return labels[actionType] || actionType;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revision History</h1>
        <p className="text-white/60 mt-1">
          View and undo/redo editor actions
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-[#181818] overflow-hidden">
        {revisions.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>No revision history yet</p>
            <p className="text-sm mt-2">Actions you perform will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {revisions.map((revision) => (
              <div
                key={revision.id}
                className={`p-4 hover:bg-white/5 transition ${
                  revision.isUndone ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {getActionLabel(revision.actionType)}
                      </span>
                      {revision.isUndone && (
                        <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">
                          Undone
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60">
                      {revision.entityType} ID: {revision.entityId}
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      By {revision.editor?.name || "Unknown"} · {formatDate(revision.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!revision.isUndone ? (
                      <button
                        onClick={() => undoRevision(revision.id)}
                        disabled={undoing === revision.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded transition disabled:opacity-50"
                        title="Undo this action"
                      >
                        <Undo2 className="h-3 w-3" />
                        {undoing === revision.id ? "Undoing..." : "Undo"}
                      </button>
                    ) : (
                      <button
                        onClick={() => redoRevision(revision.id)}
                        disabled={redoing === revision.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary/20 text-primary hover:bg-primary/30 rounded transition disabled:opacity-50"
                        title="Redo this action"
                      >
                        <Redo className="h-3 w-3" />
                        {redoing === revision.id ? "Redoing..." : "Redo"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Show state diff preview */}
                {(revision.previousState || revision.newState) && (
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-white/40 hover:text-white/60 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      View details
                    </summary>
                    <div className="mt-2 p-3 bg-black/30 rounded space-y-2">
                      {revision.previousState && (
                        <div>
                          <p className="text-white/40 mb-1">Previous:</p>
                          <pre className="text-white/60 overflow-auto">
                            {JSON.stringify(revision.previousState, null, 2)}
                          </pre>
                        </div>
                      )}
                      {revision.newState && (
                        <div>
                          <p className="text-white/40 mb-1">New:</p>
                          <pre className="text-white/60 overflow-auto">
                            {JSON.stringify(revision.newState, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}