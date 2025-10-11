"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const runSetup = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/supabase/setup", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setResponse(data);
      if (!res.ok) {
        toast.error(data?.message || "Setup failed. See details below.");
      } else {
        toast.success("Supabase setup completed.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin • Supabase Setup</h1>
          <Button onClick={runSetup} disabled={loading} className="bg-[#1db954] hover:bg-[#18a84d]">
            {loading ? "Running…" : "Run Supabase Setup"}
          </Button>
        </header>

        <p className="text-sm text-zinc-400">
          This will call /api/supabase/setup to create and/or seed demo data. If tables are missing, the response will include SQL to create them.
        </p>

        {response && (
          <div className="rounded-xl border border-white/10 bg-[#181818] p-4 overflow-auto">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed">
{JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}