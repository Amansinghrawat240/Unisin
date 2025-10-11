"use client";

import Link from "next/link";
import { Keyboard, Eye, Ear, Hand, Zap, Settings } from "lucide-react";

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] via-[#1a1a1a] to-[#121212]">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-[#1db954] via-[#8b5cf6] to-[#e91e63] bg-clip-text text-transparent">
            Accessibility at UniSin
          </h1>
          <p className="text-xl text-zinc-400">
            Music for everyone. We're committed to making UniSin accessible to all users.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="mb-16 rounded-2xl border border-white/10 bg-[#181818]/80 p-8">
          <p className="text-lg leading-relaxed text-zinc-300">
            At UniSin, we believe music should be accessible to everyone, regardless of ability. 
            We're continuously working to improve our platform's accessibility features to ensure 
            all users can discover, play, and enjoy their favorite music seamlessly.
          </p>
        </div>

        {/* Accessibility Features Grid */}
        <div className="mb-16">
          <h2 className="mb-8 text-3xl font-bold text-white">Our Accessibility Features</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Screen Reader Support */}
            <div className="group rounded-xl border border-white/10 bg-[#181818]/80 p-6 transition-all hover:border-[#1db954]/50 hover:shadow-lg hover:shadow-[#1db954]/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1db954]/10">
                <Eye className="h-6 w-6 text-[#1db954]" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Screen Reader Support</h3>
              <p className="text-zinc-400">
                Full compatibility with popular screen readers including JAWS, NVDA, and VoiceOver. 
                All UI elements are properly labeled with ARIA attributes for seamless navigation.
              </p>
            </div>

            {/* Keyboard Navigation */}
            <div className="group rounded-xl border border-white/10 bg-[#181818]/80 p-6 transition-all hover:border-[#8b5cf6]/50 hover:shadow-lg hover:shadow-[#8b5cf6]/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#8b5cf6]/10">
                <Keyboard className="h-6 w-6 text-[#8b5cf6]" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Keyboard Navigation</h3>
              <p className="text-zinc-400">
                Full keyboard navigation support with Tab, Arrow keys, Space, and Enter. 
                Control playback, browse music, and access all features without a mouse.
              </p>
            </div>

            {/* Captions & Transcripts */}
            <div className="group rounded-xl border border-white/10 bg-[#181818]/80 p-6 transition-all hover:border-[#e91e63]/50 hover:shadow-lg hover:shadow-[#e91e63]/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e91e63]/10">
                <Ear className="h-6 w-6 text-[#e91e63]" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Captions & Transcripts</h3>
              <p className="text-zinc-400">
                Closed captions for video content and podcast transcripts available. 
                Synchronized lyrics display for supported tracks to follow along.
              </p>
            </div>

            {/* High Contrast Mode */}
            <div className="group rounded-xl border border-white/10 bg-[#181818]/80 p-6 transition-all hover:border-[#1db954]/50 hover:shadow-lg hover:shadow-[#1db954]/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1db954]/10">
                <Settings className="h-6 w-6 text-[#1db954]" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">High Contrast Mode</h3>
              <p className="text-zinc-400">
                Adjustable contrast settings and color schemes to improve visibility. 
                Support for system-level accessibility preferences and dark mode.
              </p>
            </div>

            {/* Motor Accessibility */}
            <div className="group rounded-xl border border-white/10 bg-[#181818]/80 p-6 transition-all hover:border-[#8b5cf6]/50 hover:shadow-lg hover:shadow-[#8b5cf6]/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#8b5cf6]/10">
                <Hand className="h-6 w-6 text-[#8b5cf6]" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Motor Accessibility</h3>
              <p className="text-zinc-400">
                Large touch targets, reduced motion options, and voice control support. 
                Compatible with adaptive input devices and switch controls.
              </p>
            </div>

            {/* Performance & Speed */}
            <div className="group rounded-xl border border-white/10 bg-[#181818]/80 p-6 transition-all hover:border-[#e91e63]/50 hover:shadow-lg hover:shadow-[#e91e63]/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e91e63]/10">
                <Zap className="h-6 w-6 text-[#e91e63]" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Performance Optimized</h3>
              <p className="text-zinc-400">
                Fast loading times and efficient performance even on slower connections. 
                Optimized for assistive technologies with minimal lag.
              </p>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mb-16 rounded-2xl border border-white/10 bg-[#181818]/80 p-8">
          <h2 className="mb-6 text-2xl font-bold text-white">Keyboard Shortcuts</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-zinc-300">Play/Pause</span>
              <kbd className="rounded bg-[#282828] px-3 py-1 font-mono text-sm text-zinc-300">Space</kbd>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-zinc-300">Next Track</span>
              <kbd className="rounded bg-[#282828] px-3 py-1 font-mono text-sm text-zinc-300">Ctrl + →</kbd>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-zinc-300">Previous Track</span>
              <kbd className="rounded bg-[#282828] px-3 py-1 font-mono text-sm text-zinc-300">Ctrl + ←</kbd>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-zinc-300">Volume Up</span>
              <kbd className="rounded bg-[#282828] px-3 py-1 font-mono text-sm text-zinc-300">Ctrl + ↑</kbd>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-zinc-300">Volume Down</span>
              <kbd className="rounded bg-[#282828] px-3 py-1 font-mono text-sm text-zinc-300">Ctrl + ↓</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Search</span>
              <kbd className="rounded bg-[#282828] px-3 py-1 font-mono text-sm text-zinc-300">Ctrl + K</kbd>
            </div>
          </div>
        </div>

        {/* Commitment Section */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1db954]/10 to-[#8b5cf6]/10 p-8">
          <h2 className="mb-4 text-2xl font-bold text-white">Our Ongoing Commitment</h2>
          <p className="mb-4 text-zinc-300 leading-relaxed">
            Accessibility is not a destination but a continuous journey. We're actively working to:
          </p>
          <ul className="space-y-2 text-zinc-400">
            <li className="flex items-start">
              <span className="mr-2 text-[#1db954]">•</span>
              <span>Conduct regular accessibility audits with WCAG 2.1 AA compliance as our standard</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-[#8b5cf6]">•</span>
              <span>Partner with disability advocacy groups to gather feedback and improve</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-[#e91e63]">•</span>
              <span>Train our development team on inclusive design principles</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-[#1db954]">•</span>
              <span>Provide detailed documentation for assistive technology users</span>
            </li>
          </ul>
        </div>

        {/* Feedback CTA */}
        <div className="rounded-2xl border border-white/10 bg-[#181818]/80 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">Help Us Improve</h2>
          <p className="mb-6 text-zinc-400">
            Your feedback is invaluable in making UniSin more accessible. 
            If you encounter any accessibility barriers, please let us know.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#1db954] px-8 py-3 font-semibold text-white transition-all hover:bg-[#1ed760] hover:scale-105"
            >
              Contact Accessibility Team
            </a>
            <Link
              href="/"
              className="rounded-full border-2 border-white/20 bg-transparent px-8 py-3 font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}