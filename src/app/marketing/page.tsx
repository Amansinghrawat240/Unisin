import MarketingHeader from "@/components/marketing/marketing-header";
import MarketingFooter from "@/components/marketing/marketing-footer";
import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
              The ultimate home for music, artists, fans, live events, videos
            </h1>
            <p className="mt-5 text-zinc-300 text-lg">
              As the world's music hub, discover, listen, and share your soundtrack across any moment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="rounded-full bg-[#1db954] text-black font-bold px-6 py-3 hover:brightness-95 transition">
                Try 1 month for $0
              </Link>
              <Link href="#devices" className="rounded-full bg-white/10 text-white font-semibold px-6 py-3 hover:bg-white/20 transition">
                Explore devices
              </Link>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_0%_0%,rgba(139,92,246,0.3),transparent_60%),radial-gradient(80%_60%_at_100%_0%,rgba(233,30,99,0.25),transparent_60%)]" />
      </section>

      {/* Devices / Take us anywhere */}
      <section id="devices" className="border-t border-white/10 bg-[#0f0f0f]">
        <div className="container py-16 md:py-20">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-3xl md:text-4xl font-bold">Take us with you anywhere</h2>
            <p className="text-sm text-zinc-400">Car, break, or home — we fit your moment.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-[#1a1a1a] p-6 border border-white/10 hover:bg-[#1f1f1f] transition">
              <div className="h-40 w-full rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 mb-4" />
              <h3 className="text-xl font-semibold">On the road</h3>
              <p className="text-zinc-400 mt-1">CarPlay, Android Auto, and more.</p>
            </div>
            <div className="rounded-xl bg-[#1a1a1a] p-6 border border-white/10 hover:bg-[#1f1f1f] transition">
              <div className="h-40 w-full rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 mb-4" />
              <h3 className="text-xl font-semibold">On a break</h3>
              <p className="text-zinc-400 mt-1">Smartwatches, phones, tablets.</p>
            </div>
            <div className="rounded-xl bg-[#1a1a1a] p-6 border border-white/10 hover:bg-[#1f1f1f] transition">
              <div className="h-40 w-full rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 mb-4" />
              <h3 className="text-xl font-semibold">At home</h3>
              <p className="text-zinc-400 mt-1">Smart speakers, TVs, game consoles.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium features highlights */}
      <section className="border-t border-white/10">
        <div className="container py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Premium features you'll love</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { title: "Ad-free listening", desc: "Immerse in music without interruptions." },
              { title: "High-quality audio", desc: "Hear every detail with rich sound." },
              { title: "Offline downloads", desc: "Save music for when you're offline." },
              { title: "Unlimited skips", desc: "Jump to the next vibe instantly." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl bg-[#1a1a1a] p-6 border border-white/10 hover:bg-[#1f1f1f] transition">
                <div className="h-10 w-10 rounded-md bg-[#1db954]/20 mb-4" />
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-zinc-400 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/" className="inline-flex rounded-full bg-[#1db954] text-black font-bold px-6 py-3 hover:brightness-95 transition">
              Get Premium
            </Link>
          </div>
        </div>
      </section>

      {/* Personalization */}
      <section className="border-t border-white/10 bg-[#0f0f0f]">
        <div className="container py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold">Fresh ways to discover music</h2>
          <p className="text-zinc-300 mt-2 max-w-2xl">From your DJ to daylist to Wrapped, your tastes power playlists that feel made for you.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { title: "DJ Mix", desc: "An AI DJ that knows your vibe." },
              { title: "daylist", desc: "A playlist that updates with your day." },
              { title: "Wrapped", desc: "Your year in music, beautifully told." },
            ].map((c) => (
              <div key={c.title} className="rounded-xl bg-[#1a1a1a] p-6 border border-white/10 hover:bg-[#1f1f1f] transition">
                <div className="h-32 w-full rounded-lg bg-gradient-to-tr from-[#8b5cf6] to-[#e91e63] mb-4" />
                <h3 className="text-lg font-semibold">{c.title}</h3>
                <p className="text-zinc-400 mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social */}
      <section className="border-t border-white/10">
        <div className="container py-16 md:py-20">
          <div className="md:flex items-center gap-10">
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold">Jam and Blend with friends</h2>
              <p className="text-zinc-300 mt-2">Listen together, in real time. Make a Blend to merge tastes into one perfect playlist.</p>
              <div className="mt-6">
                <Link href="/" className="rounded-full bg-white/10 text-white font-semibold px-6 py-3 hover:bg-white/20 transition">Learn more</Link>
              </div>
            </div>
            <div className="md:w-1/2 mt-8 md:mt-0">
              <div className="h-56 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900" />
            </div>
          </div>
        </div>
      </section>

      {/* Artist moments */}
      <section className="border-t border-white/10 bg-[#0f0f0f]">
        <div className="container py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold">Shaping the big moments</h2>
          <p className="text-zinc-300 mt-2 max-w-2xl">From chart-topping releases to unforgettable concerts, connect with artists you love.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[0,1,2].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-white/10">
                <div className="h-44 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                <div className="p-5">
                  <h3 className="font-semibold">Live concerts & new drops</h3>
                  <p className="text-zinc-400 mt-1">Never miss a release or tour announcement.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Import + CTA */}
      <section className="border-t border-white/10">
        <div className="container py-16 md:py-20">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-tr from-[#8b5cf6] to-[#e91e63] p-8 md:p-12">
            <div className="md:flex items-center justify-between gap-8">
              <div className="md:max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-extrabold">Import your music library and join the party</h2>
                <p className="mt-2 text-white/90">Bring your playlists with you and start listening in seconds.</p>
              </div>
              <div className="mt-6 md:mt-0 flex gap-3">
                <Link href="/" className="rounded-full bg:black text-white font-bold px-6 py-3 hover:bg-black/90 transition">Get Premium</Link>
                <Link href="/login" className="rounded-full bg-white text-black font-bold px-6 py-3 hover:brightness-95 transition">Log in</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}