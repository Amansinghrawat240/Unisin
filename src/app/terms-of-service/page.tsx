import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] text-white">
      <div className="container max-w-4xl py-16 px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#1db954] via-[#8b5cf6] to-[#e91e63] bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-zinc-400">Last Updated: January 2025</p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-[#282828] rounded-lg p-6 mb-8 border border-white/10">
            <p className="text-lg leading-relaxed text-zinc-300">
              Welcome to <span className="text-[#1db954] font-semibold">UniSin</span> ("we," "our," "us"), a community-driven music streaming platform. By creating an account, streaming music, uploading content, or otherwise using UniSin, you ("user," "listener," or "creator") agree to these Terms of Service ("Terms").
            </p>
            <p className="mt-4 text-zinc-400 italic">
              If you do not agree, you must stop using UniSin immediately.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#1db954]">1.</span> About UniSin
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <p className="text-zinc-300 leading-relaxed">
                UniSin is a music discovery and streaming platform that allows users to listen, create playlists, follow artists, and for approved creators, upload and share music. UniSin is a community-first and open platform.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#8b5cf6]">2.</span> Eligibility
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <ul className="space-y-2 text-zinc-300">
                <li>• You must be at least 13 years old to use UniSin.</li>
                <li>• If you are under the legal age of majority in your jurisdiction, you must have parental or guardian consent.</li>
                <li>• By using UniSin, you confirm you have the legal capacity to enter into these Terms.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#e91e63]">3.</span> User Accounts
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <ul className="space-y-2 text-zinc-300">
                <li>• You must provide accurate information when creating an account.</li>
                <li>• You are responsible for safeguarding your login credentials.</li>
                <li>• You may not impersonate another person, use offensive usernames, or misuse another user's account.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#1db954]">4.</span> Use of UniSin
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <p className="text-zinc-300 mb-3">You may use UniSin only for personal, non-commercial purposes, unless expressly authorized.</p>
              <p className="text-zinc-400 font-semibold mb-2">You agree not to:</p>
              <ul className="space-y-2 text-zinc-300">
                <li>• Circumvent security features</li>
                <li>• Distribute malware or spam</li>
                <li>• Infringe on others' intellectual property rights</li>
                <li>• Abuse, harass, or exploit the community</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#8b5cf6]">5.</span> Creator Content
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <p className="text-zinc-300 mb-3">If you are a creator/artist:</p>
              <ul className="space-y-2 text-zinc-300">
                <li>• You must only upload music and artwork you own or have the legal right to share.</li>
                <li>• By uploading, you grant UniSin a worldwide, non-exclusive, royalty-free license to host, stream, display, and distribute your content within the platform.</li>
                <li>• You retain ownership of your content.</li>
                <li>• You acknowledge that approved content may be publicly available and streamed by other users.</li>
                <li>• UniSin reserves the right to moderate, reject, or remove content that violates laws, these Terms, or community guidelines.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#e91e63]">6.</span> Intellectual Property
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <ul className="space-y-2 text-zinc-300">
                <li>• All UniSin branding, platform design, software, and non-user content are owned by UniSin and protected by intellectual property laws.</li>
                <li>• Users and creators retain rights to their own content but grant UniSin necessary licenses to provide the service.</li>
                <li>• You may not copy, redistribute, or exploit any content on UniSin without permission.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#1db954]">7.</span> Privacy
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <p className="text-zinc-300">
                Your use of UniSin is governed by our{" "}
                <Link href="/privacy-policy" className="text-[#1db954] hover:underline font-semibold">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#8b5cf6]">8.</span> Data & Security
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <ul className="space-y-2 text-zinc-300">
                <li>• We use reasonable measures to secure data, but we cannot guarantee absolute security.</li>
                <li>• You are responsible for backing up your own data.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#e91e63]">9.</span> Community Guidelines
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <ul className="space-y-2 text-zinc-300">
                <li>• Respect creators and listeners.</li>
                <li>• Do not upload hateful, illegal, or infringing content.</li>
                <li>• Do not engage in abusive behavior.</li>
                <li>• UniSin may suspend or terminate accounts that violate these guidelines.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#1db954]">10.</span> DMCA & Copyright
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <p className="text-zinc-300 mb-3">
                If you believe your copyrighted material has been uploaded to UniSin without authorization, contact us at{" "}
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=DMCA%20Takedown"
                  className="text-[#1db954] hover:underline font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  team.unisin@gmail.com
                </a>{" "}
                with "DMCA Takedown" in the subject.
              </p>
              <p className="text-zinc-300">
                We will investigate and remove infringing content in accordance with applicable copyright laws.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#8b5cf6]">11.</span> Termination
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <p className="text-zinc-300 mb-3">We may suspend or terminate accounts at our discretion, particularly if:</p>
              <ul className="space-y-2 text-zinc-300 mb-3">
                <li>• You violate these Terms</li>
                <li>• You engage in unlawful or abusive activity</li>
                <li>• You misuse creator tools or attempt to exploit the platform</li>
              </ul>
              <p className="text-zinc-300">
                You may terminate your account at any time by deleting it in settings.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#e91e63]">12.</span> Disclaimers
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <ul className="space-y-2 text-zinc-300">
                <li>• UniSin is provided "as is" and "as available."</li>
                <li>• We do not guarantee uninterrupted service or error-free operation.</li>
                <li>• We are not responsible for any content uploaded by users or creators.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#1db954]">13.</span> Limitation of Liability
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <p className="text-zinc-300 mb-3">To the fullest extent permitted by law:</p>
              <ul className="space-y-2 text-zinc-300">
                <li>• UniSin is not liable for indirect, incidental, or consequential damages arising from your use of the service.</li>
                <li>• Our total liability will not exceed the amount you paid (if any) to UniSin in the 12 months prior to the claim.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#8b5cf6]">14.</span> International Use
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <p className="text-zinc-300">
                UniSin operates globally. You are responsible for compliance with your local laws when using the service.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#e91e63]">15.</span> Governing Law
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <p className="text-zinc-300">
                These Terms are governed by the laws of the United States. Any disputes will be resolved in the courts of that jurisdiction.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#1db954]">16.</span> Changes to Terms
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <p className="text-zinc-300">
                We may update these Terms from time to time. If significant changes are made, we will notify you via email or in-app. Continued use of UniSin means you accept the new Terms.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span className="text-[#8b5cf6]">17.</span> Contact Us
            </h2>
            <div className="bg-gradient-to-r from-[#1db954]/10 via-[#8b5cf6]/10 to-[#e91e63]/10 rounded-lg p-6 border border-white/10">
              <p className="text-zinc-300 mb-4">
                For any questions about these Terms, contact us at:
              </p>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=Terms%20of%20Service%20Inquiry"
                className="inline-flex items-center gap-2 text-[#1db954] hover:underline font-semibold text-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                📧 team.unisin@gmail.com
              </a>
              <p className="text-zinc-400 mt-2 text-sm">
                Subject: "Terms of Service Inquiry"
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-[#1db954] to-[#8b5cf6] text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}