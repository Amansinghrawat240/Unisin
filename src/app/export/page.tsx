"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export default function ExportPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/export-zip");
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "unisin-project.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1a1a1a] rounded-lg p-8 text-center border border-white/10">
        <Download className="w-16 h-16 mx-auto mb-4 text-[#1db954]" />
        <h1 className="text-2xl font-bold text-white mb-2">Export Project</h1>
        <p className="text-zinc-400 mb-6">
          Download your complete UniSin project as a ZIP file. Extract it on your PC and run <code className="bg-[#282828] px-2 py-1 rounded text-sm">npm install</code> to set it up.
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full bg-[#1db954] hover:bg-[#1ed760] disabled:bg-[#282828] text-white font-semibold py-3 px-6 rounded-full transition flex items-center justify-center gap-2"
        >
          {downloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Preparing download...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download ZIP
            </>
          )}
        </button>
      </div>
    </div>
  );
}