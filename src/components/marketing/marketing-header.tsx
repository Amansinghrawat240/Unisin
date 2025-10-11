import Link from "next/link";

export const MarketingHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur border-b border-white/10">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/marketing" className="flex items-center gap-2">
            <span className="inline-block h-8 w-8 rounded-full bg-[#1db954]" aria-hidden />
            <span className="sr-only">Home</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
            <Link href="/" className="font-semibold hover:text-white transition">Premium</Link>
            <Link href="#features" className="font-semibold hover:text-white transition">Features</Link>
            <Link href="#devices" className="font-semibold hover:text-white transition">Devices</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/register" className="text-sm font-bold text-zinc-300 hover:text-white transition">Sign up</Link>
          <Link href="/login" className="rounded-full bg-white text-black text-sm font-bold px-5 py-2 hover:scale-[1.02] transition">Log in</Link>
        </div>
      </div>
    </header>
  );
};

export default MarketingHeader;