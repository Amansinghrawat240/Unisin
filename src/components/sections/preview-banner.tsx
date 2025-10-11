"use client";

import React from 'react';
import { usePlayer } from "@/lib/hooks/use-player";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

const PreviewBanner = () => {
  const { data: session, isPending } = useSession();
  const { current } = usePlayer();

  // Don't show while loading or if user is authenticated
  if (isPending || session?.user) return null;

  // If a player bar is visible, leave room; otherwise stick to the bottom
  const bottomOffsetClass = current ? "bottom-[88px]" : "bottom-0";

  return (
    <footer className={`fixed inset-x-0 ${bottomOffsetClass} z-50 flex h-[72px] items-center justify-between bg-gradient-to-r from-[#8b5cf6] to-[#e91e63] px-6`}>
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white">
            Preview of UniSin
          </p>
          <p className="text-md mt-1">
            Sign up to get unlimited songs and Upload Your Own Music . Its All free.
          </p>
        </div>
        <Link href="/register" className="transform whitespace-nowrap rounded-full bg-white px-8 py-3 text-md font-bold text-black transition-transform hover:scale-[1.04]">
          Sign up free
        </Link>
      </div>
    </footer>
  );
};

export default PreviewBanner;