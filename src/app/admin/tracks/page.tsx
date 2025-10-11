import TracksManager from "@/components/admin/tracks-manager";

export default function AdminTracksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Tracks</h1>
      <TracksManager />
    </div>
  );
}