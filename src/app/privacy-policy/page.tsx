export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#1db954] via-[#8b5cf6] to-[#e91e63] bg-clip-text text-transparent">
            Privacy Policy for UniSin
          </h1>
          <p className="text-lg text-zinc-400">
            Last updated: January 2025
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-8">
          <p className="text-zinc-300 leading-relaxed mb-4">
            Welcome to UniSin, a modern, community-driven music streaming platform. We care deeply about your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use UniSin.
          </p>
          <p className="text-zinc-300 leading-relaxed">
            By creating an account, streaming music, uploading content, or otherwise using UniSin, you agree to the practices described in this policy.
          </p>
        </section>

        {/* About UniSin */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">1. About UniSin</h2>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
            <p className="text-zinc-300 leading-relaxed mb-4">
              UniSin is a collaborative, open community platform that allows anyone to discover, stream, and share music. It also empowers creators to upload their own tracks for others to enjoy.
            </p>
            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="text-white font-semibold mb-2">Contact Information:</p>
              <p className="text-zinc-300">Email: <a href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=Privacy%20Policy%20Inquiry" target="_blank" rel="noopener noreferrer" className="text-[#1db954] hover:underline">team.unisin@gmail.com</a></p>
              <p className="text-zinc-400 text-sm mt-1">Subject line: "Privacy Policy Inquiry"</p>
            </div>
          </div>
        </section>

        {/* Data We Collect */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">2. Data We Collect</h2>
          <p className="text-zinc-300 mb-4">We collect the following categories of information to provide and improve our services:</p>
          
          <div className="space-y-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-[#1db954]">A. Account Information</h3>
              <ul className="space-y-2 text-zinc-300">
                <li>• Name, email address, and hashed password</li>
                <li>• Profile image (optional)</li>
                <li>• Google account details (if you use Google OAuth to sign in)</li>
                <li>• Account creation date</li>
              </ul>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-[#8b5cf6]">B. Usage Data</h3>
              <ul className="space-y-2 text-zinc-300">
                <li>• Listening history and recently played tracks</li>
                <li>• Playlists created, liked songs, and saved libraries</li>
                <li>• Artists and playlists you follow</li>
                <li>• Search queries and recommendations</li>
                <li>• Session duration and general activity</li>
              </ul>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-[#e91e63]">C. Creator Data (Artists)</h3>
              <ul className="space-y-2 text-zinc-300">
                <li>• Display name, bio, and country</li>
                <li>• Uploaded audio files and album artwork</li>
                <li>• Track metadata (e.g., title, duration, genre, release date)</li>
                <li>• Creator application information and verification status</li>
              </ul>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-[#1db954]">D. Technical Data</h3>
              <ul className="space-y-2 text-zinc-300">
                <li>• IP address and geolocation (approximate)</li>
                <li>• Browser type, device type, and user agent</li>
                <li>• Session identifiers and authentication tokens</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Your Data */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">3. How We Use Your Data</h2>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
            <p className="text-zinc-300 mb-4">We use your data to:</p>
            <ul className="space-y-3 text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="text-[#1db954] font-bold">•</span>
                <span>Deliver music streaming services and platform features</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#1db954] font-bold">•</span>
                <span>Manage and secure user accounts</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#1db954] font-bold">•</span>
                <span>Personalize recommendations, playlists, and discovery feeds</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#1db954] font-bold">•</span>
                <span>Process and review creator applications and track submissions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#1db954] font-bold">•</span>
                <span>Operate moderation systems for community safety</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#1db954] font-bold">•</span>
                <span>Improve platform performance and fix issues</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#1db954] font-bold">•</span>
                <span>Communicate with you about your account, updates, and support inquiries</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#1db954] font-bold">•</span>
                <span>Generate anonymized analytics to understand how UniSin is used</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">4. Data Sharing</h2>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
            <p className="text-zinc-300 mb-4 font-semibold text-[#1db954]">
              We do NOT sell your data.
            </p>
            <p className="text-zinc-300 mb-4">
              We share limited data with third-party providers strictly for service operation:
            </p>
            <ul className="space-y-2 text-zinc-300 mb-4">
              <li>• <strong className="text-white">Google OAuth</strong> for authentication</li>
              <li>• <strong className="text-white">Turso</strong> for database hosting</li>
              <li>• <strong className="text-white">Supabase</strong> for audio/image storage</li>
            </ul>
            <p className="text-zinc-300 mb-2">
              Approved creator content (music, profile, and metadata) is made publicly visible on the platform.
            </p>
            <p className="text-zinc-300">
              We may share aggregated, anonymized statistics for research, transparency, or reporting purposes.
            </p>
          </div>
        </section>

        {/* User Rights */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">5. User Rights</h2>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 mb-4">
            <p className="text-zinc-300 mb-4">
              You have full control over your personal data. Depending on your jurisdiction (including GDPR and CCPA), you may:
            </p>
            <ul className="space-y-2 text-zinc-300">
              <li>• Access the personal data we hold about you</li>
              <li>• Correct or update your account details</li>
              <li>• Delete your account and all associated data (erased within 30 days)</li>
              <li>• Export your data for portability</li>
              <li>• Opt-out of non-essential communications</li>
              <li>• Manage your privacy preferences in your account settings</li>
            </ul>
          </div>
          <p className="text-zinc-300">
            To exercise your rights, contact <a href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=Privacy%20Rights%20Request" target="_blank" rel="noopener noreferrer" className="text-[#1db954] hover:underline">team.unisin@gmail.com</a>
          </p>
        </section>

        {/* Data Retention */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">6. Data Retention</h2>
          <div className="space-y-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-[#1db954]">Active Accounts</h3>
              <p className="text-zinc-300">We retain data as long as your account remains active.</p>
            </div>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-[#8b5cf6]">Deleted Accounts</h3>
              <p className="text-zinc-300">Data is erased within 30 days unless legal requirements mandate longer storage.</p>
            </div>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-[#e91e63]">Creator Uploads</h3>
              <p className="text-zinc-300">If you delete your creator account, your music will also be removed from UniSin unless you've chosen to release it under a public/open license.</p>
            </div>
          </div>
        </section>

        {/* Security Measures */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">7. Security Measures</h2>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
            <p className="text-zinc-300 leading-relaxed mb-4">
              We use industry-standard safeguards, including:
            </p>
            <ul className="space-y-2 text-zinc-300 mb-4">
              <li>• Encrypted data transmission (HTTPS)</li>
              <li>• Secure password hashing and authentication tokens</li>
              <li>• Regular security audits and penetration tests</li>
              <li>• Access controls limiting who can access sensitive data</li>
            </ul>
            <p className="text-zinc-400 text-sm">
              Despite these measures, no system is 100% secure. We encourage users to choose strong passwords and protect their accounts.
            </p>
          </div>
        </section>

        {/* Children's Privacy */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">8. Children's Privacy</h2>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
            <p className="text-zinc-300 leading-relaxed">
              UniSin is not intended for children under 13 years of age. We do not knowingly collect data from children. If you believe we have mistakenly collected information from a child, contact us immediately at <a href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=Children%27s%20Privacy%20Concern" target="_blank" rel="noopener noreferrer" className="text-[#1db954] hover:underline">team.unisin@gmail.com</a>.
            </p>
          </div>
        </section>

        {/* Cookies & Tracking */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">9. Cookies & Tracking</h2>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
            <p className="text-zinc-300 mb-4">We use:</p>
            <ul className="space-y-2 text-zinc-300 mb-4">
              <li>• Session cookies to keep you logged in securely</li>
              <li>• Preference cookies to remember your settings</li>
              <li>• Analytics cookies to improve service quality</li>
            </ul>
            <p className="text-zinc-400 text-sm">
              You can control or block cookies in your browser settings.
            </p>
          </div>
        </section>

        {/* International Data Transfers */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">10. International Data Transfers</h2>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
            <p className="text-zinc-300 leading-relaxed">
              As a global open community, your data may be stored or processed in multiple countries. Where required, we apply GDPR-compliant safeguards, such as Standard Contractual Clauses, for international data transfers.
            </p>
          </div>
        </section>

        {/* Open Community Principles */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">11. Open Community Principles</h2>
          <div className="bg-gradient-to-r from-[#1db954]/10 via-[#8b5cf6]/10 to-[#e91e63]/10 border border-[#1db954]/30 rounded-lg p-6">
            <p className="text-zinc-300 mb-4">
              UniSin is built as an open, community-driven music platform. This means:
            </p>
            <ul className="space-y-3 text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="text-[#1db954] font-bold">•</span>
                <span>Creator content you choose to share becomes part of a public, collaborative catalog, visible to listeners worldwide.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#8b5cf6] font-bold">•</span>
                <span>By uploading, you acknowledge that your content may be distributed across the platform and subject to moderation.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#e91e63] font-bold">•</span>
                <span>Community participation (likes, follows, playlists) is essential to UniSin's ecosystem and helps shape recommendations.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#1db954] font-bold">•</span>
                <span>We commit to transparency about moderation, algorithmic recommendations, and how community data drives discovery.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Compliance */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">12. Compliance</h2>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
            <p className="text-zinc-300 mb-4">
              We comply with major data protection regulations, including:
            </p>
            <ul className="space-y-2 text-zinc-300">
              <li>• <strong className="text-white">GDPR</strong> (European Union)</li>
              <li>• <strong className="text-white">CCPA</strong> (California, USA)</li>
              <li>• Applicable privacy laws in other jurisdictions</li>
            </ul>
          </div>
        </section>

        {/* Changes to Policy */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">13. Changes to This Policy</h2>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
            <p className="text-zinc-300 leading-relaxed">
              We may update this Privacy Policy from time to time. If significant changes occur, we will notify you via email or in-app notification. The "Last Updated" date at the top reflects the latest version. Continued use of UniSin after updates means you accept the revised policy.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">14. Contact Us</h2>
          <div className="bg-gradient-to-r from-[#1db954]/10 via-[#8b5cf6]/10 to-[#e91e63]/10 border border-[#1db954]/30 rounded-lg p-8 text-center">
            <p className="text-zinc-300 mb-6">
              If you have questions, concerns, or requests regarding this Privacy Policy, please contact us at:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=team.unisin@gmail.com&su=Privacy%20Policy%20Inquiry"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#1db954] px-8 py-3 font-semibold text-white transition-all hover:bg-[#1ed760] hover:scale-105"
              >
                📧 Contact Privacy Team
              </a>
            </div>
            <p className="text-zinc-400 mt-4">team.unisin@gmail.com</p>
            <p className="text-zinc-500 text-sm mt-2">Subject: Privacy Policy Inquiry</p>
          </div>
        </section>

        {/* GDPR & CCPA Notice */}
        <section className="mb-8">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-white">For EU/UK Users (GDPR)</h3>
            <p className="text-zinc-300 text-sm mb-4">
              If you are located in the European Union or United Kingdom, you have additional rights under GDPR, including the right to lodge a complaint with your local data protection authority.
            </p>
            <h3 className="text-lg font-semibold mb-3 text-white">For California Users (CCPA)</h3>
            <p className="text-zinc-300 text-sm">
              California residents have specific rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected and the right to opt-out of the sale of personal information. We do not sell personal information.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}