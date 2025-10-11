import Link from "next/link";
import { Home, Download } from "lucide-react";

export default function PressPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] text-white">
      <div className="container max-w-4xl py-12 px-6">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#1db954] via-[#8b5cf6] to-[#e91e63] bg-clip-text text-transparent">
          Press / Media Kit – UniSin
        </h1>
        <p className="text-lg text-zinc-300 mb-12">
          Thank you for your interest in UniSin! Here's everything you need for media coverage and press inquiries.
        </p>

        {/* About UniSin Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">🎵</span>
            <span className="bg-gradient-to-r from-[#1db954] to-[#8b5cf6] bg-clip-text text-transparent">
              About UniSin
            </span>
          </h2>
          
          <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-8">
            <p className="text-zinc-300 text-lg leading-relaxed">
              UniSin is a modern, community-first music streaming platform. We empower listeners to discover, stream, and share music while giving creators the tools to upload, manage, and connect directly with fans.
            </p>
          </div>
        </section>

        {/* Press Contact Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">📰</span>
            <span className="bg-gradient-to-r from-[#8b5cf6] to-[#e91e63] bg-clip-text text-transparent">
              Press Contact
            </span>
          </h2>
          
          <div className="bg-gradient-to-r from-[#1db954]/20 via-[#8b5cf6]/20 to-[#e91e63]/20 border border-white/20 rounded-lg p-8 text-center">
            <p className="text-zinc-300 mb-2">
              📧{" "}
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=Press%20Inquiry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1db954] hover:underline font-semibold text-lg"
              >
                team.unisin@gmail.com
              </a>
            </p>
            <p className="text-zinc-400 text-sm">
              Subject: "Press Inquiry"
            </p>
          </div>
        </section>

        {/* Media Kit Includes Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">📂</span>
            <span className="bg-gradient-to-r from-[#e91e63] to-[#1db954] bg-clip-text text-transparent">
              Media Kit Includes
            </span>
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-[#1a1a1a]/50 border border-[#1db954]/30 rounded-lg p-6 hover:border-[#1db954] transition-colors">
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-[#1db954] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Logo Files</h3>
                  <p className="text-zinc-400 text-sm">PNG, SVG, transparent background</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-[#8b5cf6]/30 rounded-lg p-6 hover:border-[#8b5cf6] transition-colors">
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-[#8b5cf6] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Brand Colors & Fonts</h3>
                  <p className="text-zinc-400 text-sm">Complete brand guidelines</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-[#e91e63]/30 rounded-lg p-6 hover:border-[#e91e63] transition-colors">
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-[#e91e63] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Product Screenshots</h3>
                  <p className="text-zinc-400 text-sm">Homepage, playlists, creator dashboard</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-[#1db954]/30 rounded-lg p-6 hover:border-[#1db954] transition-colors">
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-[#1db954] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Press Release Templates</h3>
                  <p className="text-zinc-400 text-sm">Platform launch, milestones, partnerships</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Talking Points Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">🗣️</span>
            <span className="bg-gradient-to-r from-[#1db954] to-[#e91e63] bg-clip-text text-transparent">
              Talking Points
            </span>
          </h2>
          
          <div className="space-y-4">
            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#1db954]/50 transition-colors">
              <p className="text-zinc-300 italic">
                "UniSin is built as an open community — music belongs to everyone, and discovery should be fair."
              </p>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#8b5cf6]/50 transition-colors">
              <p className="text-zinc-300 italic">
                "Creators retain ownership of their content while reaching a global audience."
              </p>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#e91e63]/50 transition-colors">
              <p className="text-zinc-300 italic">
                "We're building a platform that is privacy-conscious, transparent, and user-first."
              </p>
            </div>
          </div>
        </section>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#1db954] hover:text-[#1ed760] transition-colors"
          >
            <Home className="h-4 w-4" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}