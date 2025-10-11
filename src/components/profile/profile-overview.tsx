"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface LocalUser {
  id?: string | number;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export const ProfileOverview: React.FC = () => {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      // Use session data as primary source
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        avatarUrl: session.user.image ?? undefined,
      });
      setLoaded(true);
    } else {
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          setUser(JSON.parse(raw));
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoaded(true);
      }
    }
  }, [session]);

  const getAuthHeaders = (): HeadersInit => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    try {
      const token = localStorage.getItem("bearer_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id) headers["x-test-user-id"] = String(u.id);
        if (u?.email) headers["x-user-email"] = String(u.email);
        if (u?.name) headers["x-user-name"] = String(u.name);
      }
    } catch {}
    return headers;
  };

  const startEditing = () => {
    setNameInput(user?.name || "");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setNameInput("");
  };

  const saveName = async () => {
    try {
      const trimmed = nameInput.trim();
      const valid = /^[a-zA-Z0-9 _-]{3,32}$/.test(trimmed);
      if (!valid) {
        toast.error("Name must be 3–32 chars. Letters, numbers, spaces, _ and - only.");
        return;
      }
      setSaving(true);
      const res = await fetch("/api/v1/me/profile", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update name");
      }
      // Update local user cache
      const updated: LocalUser = { ...(user || {}), name: data?.name || trimmed };
      setUser(updated);
      try {
        localStorage.setItem("user", JSON.stringify(updated));
      } catch {}
      toast.success("Name updated");
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded || isPending) {
    return (
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse" />
        <div className="h-4 w-40 rounded bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-start gap-3 text-zinc-300">
        <p>You are not logged in.</p>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-full bg-white text-black text-sm font-bold px-4 py-2 hover:brightness-95 transition">Log in</Link>
          <Link href="/register" className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-white/40 transition">Create account</Link>
        </div>
      </div>
    );
  }

  const initial = (user.name || user.email || "?").slice(0, 1).toUpperCase();

  return (
    <section className="flex flex-col sm:flex-row sm:items-center gap-6">
      <div className="relative h-24 w-24 shrink-0 rounded-full bg-[#2a2a2a] flex items-center justify-center text-3xl font-bold">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name || user.email || "Avatar"} className="h-full w-full rounded-full object-cover" />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      <div className="space-y-1">
        {!editing ? (
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{user.name || "Your Name"}</h2>
            <button onClick={startEditing} className="text-sm rounded-full border border-white/20 px-3 py-1 hover:border-white/40 transition">Edit name</button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <div className="flex flex-col gap-1">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                className={`bg-[#2a2a2a] border rounded-md px-3 py-2 text-sm text-white outline-none focus:border-white/40 ${/^[a-zA-Z0-9 _-]{3,32}$/.test(nameInput.trim()) || nameInput.trim().length === 0 ? "border-white/20" : "border-red-500/60"}`}
              />
              {(() => {
                const trimmed = nameInput.trim();
                const valid = /^[a-zA-Z0-9 _-]{3,32}$/.test(trimmed);
                const count = trimmed.length;
                const changed = trimmed !== (user.name || "");
                return (
                  <p className={`text-xs ${valid || count === 0 ? "text-zinc-400" : "text-red-400"}`}>
                    {count}/32 • 3–32 characters. Allowed: letters, numbers, spaces, _ and -.
                    {!valid && count > 0 && (
                      <span className="ml-1">Please fix the highlighted input.</span>
                    )}
                    {!changed && count > 0 && valid && (
                      <span className="ml-1 text-zinc-500">No changes detected.</span>
                    )}
                  </p>
                );
              })()}
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const trimmed = nameInput.trim();
                const valid = /^[a-zA-Z0-9 _-]{3,32}$/.test(trimmed);
                const changed = trimmed !== (user.name || "");
                return (
                  <button onClick={saveName} disabled={saving || !valid || !changed} className="rounded-full bg-[#1db954] text-black text-sm font-bold px-4 py-2 hover:brightness-95 transition disabled:opacity-50">
                    {saving ? "Saving…" : "Save"}
                  </button>
                );
              })()}
              <button onClick={cancelEditing} disabled={saving} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-white/40 transition disabled:opacity-50">Cancel</button>
            </div>
          </div>
        )}
        {user.email && <p className="text-zinc-400">{user.email}</p>}
        <div className="mt-4 flex items-center gap-3">
          <Link href="/creator" className="rounded-full bg-[#1db954] text-black text-sm font-bold px-4 py-2 hover:brightness-95 transition">Creator dashboard</Link>
        </div>
      </div>
    </section>
  );
};
