import Link from "next/link";
import { Home, Briefcase } from "lucide-react";

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] text-white">
      <div className="container max-w-4xl py-12 px-6">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#1db954] via-[#8b5cf6] to-[#e91e63] bg-clip-text text-transparent">
          Careers / Join Us – UniSin
        </h1>
        <p className="text-lg text-zinc-300 mb-12">
          At UniSin, we believe music should be open, community-driven, and accessible to everyone. We're building the future of music discovery — and we'd love for you to join us.
        </p>

        {/* Why Work With Us Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">💡</span>
            <span className="bg-gradient-to-r from-[#1db954] to-[#8b5cf6] bg-clip-text text-transparent">
              Why Work With Us?
            </span>
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-[#1a1a1a]/50 border border-[#1db954]/30 rounded-lg p-6 hover:border-[#1db954] transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#1db954]">Impact</h3>
              <p className="text-zinc-300">
                Help shape a platform that empowers both listeners and creators.
              </p>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-[#8b5cf6]/30 rounded-lg p-6 hover:border-[#8b5cf6] transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#8b5cf6]">Culture</h3>
              <p className="text-zinc-300">
                We're open, collaborative, and community-first.
              </p>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-[#e91e63]/30 rounded-lg p-6 hover:border-[#e91e63] transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#e91e63]">Growth</h3>
              <p className="text-zinc-300">
                Work with modern tech stacks (Next.js, Supabase, Turso, Cloudflare) and solve real challenges at scale.
              </p>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-[#1db954]/30 rounded-lg p-6 hover:border-[#1db954] transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#1db954]">Vision</h3>
              <p className="text-zinc-300">
                Millions of users discovering music in a fair and open way.
              </p>
            </div>
          </div>
        </section>

        {/* Current Openings Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">🌍</span>
            <span className="bg-gradient-to-r from-[#8b5cf6] to-[#e91e63] bg-clip-text text-transparent">
              Current Openings
            </span>
          </h2>
          
          <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-8 mb-6">
            <p className="text-zinc-300 mb-6">
              Right now, we're early stage — but if you're passionate about music + technology, we'd love to hear from you:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white hover:text-[#1db954] transition-colors">
                <Briefcase className="h-5 w-5 text-[#1db954]" />
                <span className="font-medium">Frontend Developer (React/Next.js)</span>
              </div>
              
              <div className="flex items-center gap-3 text-white hover:text-[#8b5cf6] transition-colors">
                <Briefcase className="h-5 w-5 text-[#8b5cf6]" />
                <span className="font-medium">Backend Engineer (Node.js/Postgres/Edge systems)</span>
              </div>
              
              <div className="flex items-center gap-3 text-white hover:text-[#e91e63] transition-colors">
                <Briefcase className="h-5 w-5 text-[#e91e63]" />
                <span className="font-medium">Community Manager</span>
              </div>
              
              <div className="flex items-center gap-3 text-white hover:text-[#1db954] transition-colors">
                <Briefcase className="h-5 w-5 text-[#1db954]" />
                <span className="font-medium">UI/UX Designer</span>
              </div>
            </div>
          </div>
        </section>

        {/* How to Apply Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">📧</span>
            <span className="bg-gradient-to-r from-[#e91e63] to-[#1db954] bg-clip-text text-transparent">
              How to Apply
            </span>
          </h2>
          
          <div className="bg-gradient-to-r from-[#1db954]/20 via-[#8b5cf6]/20 to-[#e91e63]/20 border border-white/20 rounded-lg p-8">
            <p className="text-zinc-300 mb-4">
              Send us an email at{" "}
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=Join%20UniSin%20%E2%80%93%20%5BRole%5D"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1db954] hover:underline font-semibold"
              >
                team.unisin@gmail.com
              </a>{" "}
              with:
            </p>
            
            <ul className="space-y-2 text-zinc-300 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-[#1db954] font-bold">•</span>
                <span>Subject line: "Join UniSin – [Role]"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#8b5cf6] font-bold">•</span>
                <span>A short intro about yourself</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#e91e63] font-bold">•</span>
                <span>Links to your portfolio, GitHub, or LinkedIn</span>
              </li>
            </ul>
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