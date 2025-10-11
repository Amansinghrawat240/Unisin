import { Suspense } from "react";
import CreatorDashboard from "@/components/creator/creator-dashboard";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-white/10 rounded"></div>
        <div className="h-4 w-48 bg-white/10 rounded"></div>
        <div className="mt-8 grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CreatorPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CreatorDashboard />
    </Suspense>
  );
}