import { EditorNav } from "@/components/editor/editor-nav";

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <EditorNav />
      <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#1a1a1a] to-[#121212]">
        <div className="mx-auto w-full max-w-7xl px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}