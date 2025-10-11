import Link from "next/link";
import { Home } from "lucide-react";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] text-white">
      <div className="container max-w-4xl py-12 px-6">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#1db954] via-[#8b5cf6] to-[#e91e63] bg-clip-text text-transparent">
          FAQ / Help Center – UniSin
        </h1>
        <p className="text-lg text-zinc-300 mb-12">
          Welcome to the UniSin Help Center! Here are answers to common questions from listeners and creators.
        </p>

        {/* For Listeners Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">🎧</span>
            <span className="bg-gradient-to-r from-[#1db954] to-[#8b5cf6] bg-clip-text text-transparent">
              For Listeners
            </span>
          </h2>
          
          <div className="space-y-6">
            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#1db954]/50 transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#1db954]">Q: How do I create an account?</h3>
              <p className="text-zinc-300">
                <strong className="text-white">A:</strong> You can sign up with your email and password or use Google to log in quickly.
              </p>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#1db954]/50 transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#1db954]">Q: Is UniSin free?</h3>
              <p className="text-zinc-300">
                <strong className="text-white">A:</strong> Yes! UniSin is free to use. As we grow, some advanced features may be introduced, but music discovery and streaming will always remain accessible.
              </p>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#1db954]/50 transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#1db954]">Q: How do I create playlists?</h3>
              <p className="text-zinc-300">
                <strong className="text-white">A:</strong> Go to your library, click "New Playlist", add a name, and start adding tracks. You can also reorder or share your playlists anytime.
              </p>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#1db954]/50 transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#1db954]">Q: Can I follow artists and playlists?</h3>
              <p className="text-zinc-300">
                <strong className="text-white">A:</strong> Absolutely. Following lets you stay updated on new tracks, albums, or changes to playlists you enjoy.
              </p>
            </div>
          </div>
        </section>

        {/* For Creators Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">🎤</span>
            <span className="bg-gradient-to-r from-[#8b5cf6] to-[#e91e63] bg-clip-text text-transparent">
              For Creators
            </span>
          </h2>
          
          <div className="space-y-6">
            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#8b5cf6]/50 transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#8b5cf6]">Q: Who can upload music to UniSin?</h3>
              <p className="text-zinc-300">
                <strong className="text-white">A:</strong> Any approved creator can apply to upload. Just apply via the Creator Dashboard and, once approved, you can start uploading your tracks.
              </p>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#8b5cf6]/50 transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#8b5cf6]">Q: What kind of content can I upload?</h3>
              <p className="text-zinc-300">
                <strong className="text-white">A:</strong> You can upload all music that you want to upload.
              </p>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#8b5cf6]/50 transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#8b5cf6]">Q: How are uploads moderated?</h3>
              <p className="text-zinc-300">
                <strong className="text-white">A:</strong> All tracks go through a submission and moderation system to ensure quality and compliance. Approved content becomes visible to listeners worldwide.
              </p>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#8b5cf6]/50 transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#8b5cf6]">Q: Can I edit or delete my uploads?</h3>
              <p className="text-zinc-300">
                <strong className="text-white">A:</strong> Yes, creators can manage and update their tracks and metadata from the Creator Dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* Account & Privacy Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">🔐</span>
            <span className="bg-gradient-to-r from-[#e91e63] to-[#1db954] bg-clip-text text-transparent">
              Account & Privacy
            </span>
          </h2>
          
          <div className="space-y-6">
            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#e91e63]/50 transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#e91e63]">Q: How can I delete my account?</h3>
              <p className="text-zinc-300">
                <strong className="text-white">A:</strong> Go to Settings &gt; Account &gt; Delete Account. Your data will be removed within 30 days.
              </p>
            </div>

            <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-6 hover:border-[#e91e63]/50 transition-colors">
              <h3 className="text-lg font-semibold mb-2 text-[#e91e63]">Q: How does UniSin protect my privacy?</h3>
              <p className="text-zinc-300">
                <strong className="text-white">A:</strong> We use encrypted transmission, secure authentication, and strict data protection measures. See our{" "}
                <Link href="/privacy-policy" className="text-[#1db954] hover:underline">
                  Privacy Policy
                </Link>{" "}
                for details.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-[#1db954]/20 via-[#8b5cf6]/20 to-[#e91e63]/20 border border-white/20 rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Can't find your answer?</h3>
          <p className="text-zinc-300 mb-4">
            📧 Contact us at{" "}
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=Support%20Request"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1db954] hover:underline font-semibold"
            >
              team.unisin@gmail.com
            </a>{" "}
            with the subject line "Support Request".
          </p>
        </div>

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