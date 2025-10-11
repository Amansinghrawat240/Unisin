import Link from "next/link";
import AdminModerationDashboard from "@/components/admin/moderation-dashboard";

export default function AdminMusicModerationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Music Moderation</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/moderation/creators" className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:border-white/40">Creators</Link>
          <Link href="/admin/moderation/music" className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-black hover:brightness-95">Music</Link>
        </div>
      </div>
      <AdminModerationDashboard mode="music" />
    </div>
  );
}