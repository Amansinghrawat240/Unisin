import AdminNav from "@/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNav />
      <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#1a1a1a] to-[#121212]">
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}