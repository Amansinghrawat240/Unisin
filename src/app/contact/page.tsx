import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#121212]/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-[#1db954] via-[#8b5cf6] to-[#e91e63] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            UniSin
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Page Title */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#1db954] via-[#8b5cf6] to-[#e91e63] bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-lg text-[#b3b3b3] max-w-2xl mx-auto">
            We'd love to hear from you! Whether you're a listener, creator, or partner, your feedback helps UniSin grow as an open and community-driven music platform.
          </p>
        </div>

        {/* Contact Sections */}
        <div className="space-y-8">
          {/* General Inquiries */}
          <section className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-8 hover:border-[#1db954]/50 transition-colors">
            <div className="flex items-start gap-4">
              <span className="text-4xl" role="img" aria-label="Headphones">
                🎧
              </span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3 text-white">General Inquiries</h2>
                <p className="text-[#b3b3b3] mb-4">
                  For questions about using UniSin, account support, or general feedback:
                </p>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=General%20Inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#1db954] hover:text-[#1ed760] font-medium transition-colors"
                >
                  📧 team.unisin@gmail.com
                </a>
                <p className="text-sm text-[#6a6a6a] mt-2">Subject line: "General Inquiry"</p>
              </div>
            </div>
          </section>

          {/* Creators & Artists */}
          <section className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-8 hover:border-[#8b5cf6]/50 transition-colors">
            <div className="flex items-start gap-4">
              <span className="text-4xl" role="img" aria-label="Microphone">
                🎤
              </span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3 text-white">Creators & Artists</h2>
                <p className="text-[#b3b3b3] mb-4">
                  If you're an artist or creator and need help with uploading tracks, managing your profile, or using the creator dashboard:
                </p>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=Creator%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#8b5cf6] hover:text-[#9d6fff] font-medium transition-colors"
                >
                  📧 team.unisin@gmail.com
                </a>
                <p className="text-sm text-[#6a6a6a] mt-2">Subject line: "Creator Support"</p>
              </div>
            </div>
          </section>

          {/* Privacy & Data Requests */}
          <section className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-8 hover:border-[#e91e63]/50 transition-colors">
            <div className="flex items-start gap-4">
              <span className="text-4xl" role="img" aria-label="Shield">
                🛡️
              </span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3 text-white">Privacy & Data Requests</h2>
                <p className="text-[#b3b3b3] mb-4">
                  For privacy-related concerns, including data access, deletion, or GDPR/CCPA rights requests:
                </p>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=Privacy%20Policy%20Inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#e91e63] hover:text-[#f92672] font-medium transition-colors"
                >
                  📧 team.unisin@gmail.com
                </a>
                <p className="text-sm text-[#6a6a6a] mt-2">Subject line: "Privacy Policy Inquiry"</p>
              </div>
            </div>
          </section>

          {/* Partnerships & Collaboration */}
          <section className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-8 hover:border-[#1db954]/50 transition-colors">
            <div className="flex items-start gap-4">
              <span className="text-4xl" role="img" aria-label="Handshake">
                🤝
              </span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3 text-white">Partnerships & Collaboration</h2>
                <p className="text-[#b3b3b3] mb-4">
                  Interested in partnering with UniSin, collaborating on projects, or supporting the open music community?
                </p>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=Partnership%20Inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#1db954] hover:text-[#1ed760] font-medium transition-colors"
                >
                  📧 team.unisin@gmail.com
                </a>
                <p className="text-sm text-[#6a6a6a] mt-2">Subject line: "Partnership Inquiry"</p>
              </div>
            </div>
          </section>

          {/* Report an Issue */}
          <section className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-8 hover:border-[#8b5cf6]/50 transition-colors">
            <div className="flex items-start gap-4">
              <span className="text-4xl" role="img" aria-label="Bug">
                🐞
              </span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3 text-white">Report an Issue</h2>
                <p className="text-[#b3b3b3] mb-4">
                  Found a bug, problem, or something that doesn't feel right? Help us improve:
                </p>
                <ul className="list-disc list-inside text-[#b3b3b3] mb-4 space-y-2">
                  <li>Use the in-app "Report a Problem" option (coming soon)</li>
                  <li>
                    Or email us:{" "}
                    <a
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=Bug%20Report"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8b5cf6] hover:text-[#9d6fff] font-medium transition-colors"
                    >
                      team.unisin@gmail.com
                    </a>
                  </li>
                </ul>
                <p className="text-sm text-[#6a6a6a]">Subject line: "Bug Report"</p>
              </div>
            </div>
          </section>

          {/* Community First */}
          <section className="bg-gradient-to-r from-[#1db954]/10 via-[#8b5cf6]/10 to-[#e91e63]/10 rounded-2xl border border-white/20 p-8">
            <div className="flex items-start gap-4">
              <span className="text-4xl" role="img" aria-label="Globe">
                🌍
              </span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3 text-white">Community First</h2>
                <p className="text-[#b3b3b3] mb-3">
                  UniSin is built as an open, collaborative music community. We value every message, and we try to respond within 2–3 business days.
                </p>
                <p className="text-white font-medium">
                  Thank you for helping us make UniSin better for everyone.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#1db954] to-[#1ed760] text-white font-semibold rounded-full hover:scale-105 transition-transform"
          >
            ← Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-[#6a6a6a]">
          <p>© 2025 UniSin - Open Music Community</p>
        </div>
      </footer>
    </div>
  );
}