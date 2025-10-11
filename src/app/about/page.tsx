import TopNavigation from "@/components/sections/top-navigation";
import Sidebar from "@/components/sections/sidebar";
import Footer from "@/components/sections/footer";
import { Music, Users, Globe, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <TopNavigation />
      
      <main className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 bg-gradient-to-r from-[#1db954] via-[#8b5cf6] to-[#e91e63] bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
                About UniSin
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[#b3b3b3]">
            Your gateway to unlimited music streaming
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-8 md:p-12">
            <h2 className="mb-6 text-3xl font-bold">Our Mission</h2>
            <p className="text-lg leading-relaxed text-[#b3b3b3]">
                At UniSin, we believe music is the universal language that brings people together. 
                Our mission is to empower artists to share their creativity with the world while 
                providing listeners with an unparalleled music discovery experience.
            </p>
            <p className="text-[#b3b3b3] text-lg leading-relaxed">
                We're committed to building a platform that respects artists' rights, rewards creativity, 
                and delivers the best listening experience possible.
            </p>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="rounded-xl border border-white/10 bg-[#181818]/80 p-6 hover:border-[#1db954] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#1db954]/20 flex items-center justify-center mb-4">
              <Music className="w-6 h-6 text-[#1db954]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Artist First</h3>
            <p className="text-zinc-400 leading-relaxed">
              We prioritize fair compensation and provide tools for artists to thrive, 
              from emerging talent to established stars.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#181818]/80 p-6 hover:border-[#8b5cf6] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-[#8b5cf6]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Community Driven</h3>
            <p className="text-zinc-400 leading-relaxed">
              Our community shapes the platform. We listen to feedback and evolve 
              based on what matters most to music lovers.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#181818]/80 p-6 hover:border-[#e91e63] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#e91e63]/20 flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-[#e91e63]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Global Reach</h3>
            <p className="text-zinc-400 leading-relaxed">
              Music knows no borders. We connect listeners worldwide with diverse 
              sounds from every corner of the globe.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#181818]/80 p-6 hover:border-[#1db954] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#1db954]/20 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-[#1db954]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Passion for Music</h3>
            <p className="text-zinc-400 leading-relaxed">
              Music is in our DNA. Every feature we build is driven by our love 
              for music and dedication to the listening experience.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1db954]/10 to-[#8b5cf6]/10 p-8 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-[#1db954] mb-2">100M+</div>
              <div className="text-sm text-zinc-400">Tracks</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#8b5cf6] mb-2">5M+</div>
              <div className="text-sm text-zinc-400">Artists</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#e91e63] mb-2">500M+</div>
              <div className="text-sm text-zinc-400">Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#1db954] mb-2">180+</div>
              <div className="text-sm text-zinc-400">Countries</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-12 rounded-2xl border border-white/10 bg-[#181818]/80 mb-16">
          <h2 className="text-3xl font-bold mb-4 text-white">Join the Revolution</h2>
          <p className="text-zinc-300 text-lg mb-6 max-w-2xl mx-auto">
            Whether you're an artist looking to share your music or a listener 
            seeking your next favorite song, Unisin is your home.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/register"
              className="bg-[#1db954] text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Sign Up Free
            </a>
            <a
              href="/creator"
              className="border border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-black transition-colors"
            >
              Become a Creator
            </a>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}