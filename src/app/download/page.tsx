import Link from "next/link";
import Image from "next/image";
import { Smartphone, Download, Music, Headphones, Upload, ListMusic } from "lucide-react";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#1db954] via-[#8b5cf6] to-[#e91e63] mb-6">
            <Smartphone className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-[#1db954] via-[#8b5cf6] to-[#e91e63] bg-clip-text text-transparent">
            Download UniSin
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Take your music everywhere. Stream millions of songs, create playlists, and discover new artists on the go.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Android */}
            <div className="rounded-2xl border border-white/10 bg-[#181818]/80 p-8 hover:border-[#1db954]/50 transition-all hover:shadow-xl hover:shadow-[#1db954]/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center">
                  <Image
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/google-play-store-mobile-apps-logo-free-1759736081550.png"
                    alt="Google Play Store"
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Android</h2>
                  <p className="text-sm text-zinc-400">Get it on Play Store</p>
                </div>
              </div>
              <a
                href="https://play.google.com/store/apps/" 
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-[#1db954] to-[#159e43] text-white text-center font-bold py-4 rounded-xl hover:brightness-110 transition-all"
              >
                Download for Android
              </a>
              <p className="text-xs text-zinc-500 mt-3 text-center">
                Link will be available soon
              </p>
            </div>

            {/* iOS */}
            <div className="rounded-2xl border border-white/10 bg-[#181818]/80 p-8 hover:border-[#8b5cf6]/50 transition-all hover:shadow-xl hover:shadow-[#8b5cf6]/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center">
                  <Image
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/App_Store_26_icon-1759736289533.png"
                    alt="Apple App Store"
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">iPhone</h2>
                  <p className="text-sm text-zinc-400">Get it on App Store</p>
                </div>
              </div>
              <a
                href="https://www.apple.com/in/app-store/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white text-center font-bold py-4 rounded-xl hover:brightness-110 transition-all"
              >
                Download for iPhone
              </a>
              <p className="text-xs text-zinc-500 mt-3 text-center">
                Link will be available soon
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-center mb-8 text-white">
            Why Download UniSin?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border border-white/10 bg-[#181818]/60 p-6 text-center hover:border-[#1db954]/50 transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1db954]/20 mb-4">
                <Music className="h-6 w-6 text-[#1db954]" />
              </div>
              <h3 className="font-bold text-white mb-2">Millions of Songs</h3>
              <p className="text-sm text-zinc-400">Access unlimited music from creators worldwide</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#181818]/60 p-6 text-center hover:border-[#8b5cf6]/50 transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#8b5cf6]/20 mb-4">
                <Headphones className="h-6 w-6 text-[#8b5cf6]" />
              </div>
              <h3 className="font-bold text-white mb-2">Offline Listening</h3>
              <p className="text-sm text-zinc-400">Download your favorite tracks and listen anywhere</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#181818]/60 p-6 text-center hover:border-[#e91e63]/50 transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#e91e63]/20 mb-4">
                <Upload className="h-6 w-6 text-[#e91e63]" />
              </div>
              <h3 className="font-bold text-white mb-2">Upload Music</h3>
              <p className="text-sm text-zinc-400">Share your tracks with millions of listeners</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#181818]/60 p-6 text-center hover:border-[#1db954]/50 transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1db954]/20 mb-4">
                <ListMusic className="h-6 w-6 text-[#1db954]" />
              </div>
              <h3 className="font-bold text-white mb-2">Custom Playlists</h3>
              <p className="text-sm text-zinc-400">Create and share playlists with friends</p>
            </div>
          </div>
        </div>

        {/* System Requirements */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="rounded-2xl border border-white/10 bg-[#181818]/60 p-8">
            <h2 className="text-xl font-bold text-white mb-6 text-center">System Requirements</h2>
            <div className="grid sm:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-bold text-[#1db954] mb-3">Android</h3>
                <ul className="space-y-2 text-zinc-400">
                  <li>• Android 8.0 or higher</li>
                  <li>• 100 MB free storage</li>
                  <li>• Internet connection required</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-[#8b5cf6] mb-3">iOS</h3>
                <ul className="space-y-2 text-zinc-400">
                  <li>• iOS 14.0 or higher</li>
                  <li>• 100 MB free storage</li>
                  <li>• Internet connection required</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Return Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white text-black font-bold px-8 py-3 hover:scale-105 transition"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}