import Link from "next/link";

export const MarketingFooter = () => {
  return (
    <footer className="w-full bg-black border-t border-white/10 text-zinc-300">
      <div className="container py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
        <div>
          <h3 className="mb-4 text-base font-semibold text-white">Company</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/about" className="text-[#b3b3b3] hover:text-white transition-colors">
                About UniSin
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white">Jobs</Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white">For the Record</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">Communities</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-white">For Artists</Link></li>
            <li><Link href="#" className="hover:text-white">Developers</Link></li>
            <li><Link href="#" className="hover:text-white">Advertising</Link></li>
            <li><Link href="#" className="hover:text-white">Investors</Link></li>
            <li><Link href="#" className="hover:text-white">Vendors</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-base font-semibold text-white">Useful Links</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/help" className="text-[#b3b3b3] hover:text-white transition-colors">
                Support for UniSin
              </Link>
            </li>
            <li><Link href="#" className="hover:text-white">Web Player</Link></li>
            <li><Link href="#" className="hover:text-white">Free Mobile App</Link></li>
            <li><Link href="#" className="hover:text-white">Import Your Music</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">Unisin Plans</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/pricing" className="hover:text-white">Premium Individual</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Premium Duo</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Premium Family</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Premium Student</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Unisin Free</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Audiobooks Access</Link></li>
          </ul>
        </div>
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">Language</h4>
          <button className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
            English
          </button>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-white">Legal</Link>
            <Link href="#" className="hover:text-white">Privacy Policy</Link>
            <Link href="#" className="hover:text-white">Cookies</Link>
            <Link href="#" className="hover:text-white">About Ads</Link>
            <Link href="#" className="hover:text-white">Accessibility</Link>
          </div>
          <p className="text-zinc-500">© {new Date().getFullYear()} Unisin Clone – for demo purposes</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
        <p className="text-sm text-[#6a6a6a]">
          © 2024 UniSin. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default MarketingFooter;