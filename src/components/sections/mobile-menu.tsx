"use client";

import { useState, useEffect } from "react";
import { Menu, X, ExternalLink } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [isWebView, setIsWebView] = useState(false);

  // Detect if running in WebView
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroidWebView = /wv/.test(userAgent) || 
                             /Android.*AppleWebKit(?!.*Chrome)/.test(userAgent) ||
                             (typeof (window as any).AndroidInterface !== 'undefined');
    setIsWebView(isAndroidWebView);
  }, []);

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error(error.code);
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      setIsOpen(false);
      // Use window.location for WebView compatibility
      if (isWebView) {
        window.location.href = "/";
      } else {
        router.push("/");
      }
    }
  };

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    // Use different navigation methods based on environment
    if (isWebView) {
      // For WebView, use direct navigation
      window.location.href = path;
    } else {
      // For regular browsers, use Next.js router
      router.push(path);
    }
  };

  if (isPending) {
    return (
      <button className="p-2 rounded-full hover:bg-[#1a1a1a] transition-colors">
        <Menu className="h-6 w-6 text-white" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full hover:bg-[#1a1a1a] transition-colors"
      >
        <Menu className="h-6 w-6 text-white" />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80" onClick={() => setIsOpen(false)}>
          <div
            className="fixed right-0 top-0 h-full w-[85vw] max-w-[360px] bg-black border-l border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-[#1a1a1a] transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              {!session?.user ? (
                // Not logged in menu
                <>
                  <button
                    onClick={() => handleNavigation("/login")}
                    className="w-full text-left px-4 py-3 text-white font-semibold text-lg hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => handleNavigation("/register")}
                    className="w-full text-left px-4 py-3 text-white font-semibold text-lg hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Sign up
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-white/10 my-4" />

                  <button
                    onClick={() => handleNavigation("/creator")}
                    className="w-full text-left px-4 py-3 text-white font-semibold hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Creator
                  </button>
                  <button
                    onClick={() => handleNavigation("/download")}
                    className="w-full text-left px-4 py-3 text-white font-semibold hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleNavigation("/privacy-policy")}
                    className="w-full text-left px-4 py-3 text-white font-semibold hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Privacy
                  </button>
                  <button
                    onClick={() => handleNavigation("/terms-of-service")}
                    className="w-full text-left px-4 py-3 text-white font-semibold hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Terms
                  </button>
                </>
              ) : (
                // Logged in menu
                <>
                  <button
                    onClick={() => handleNavigation("/profile")}
                    className="w-full text-left px-4 py-3 text-white font-semibold text-lg hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-white font-semibold text-lg hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Log Out
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-white/10 my-4" />

                  <button
                    onClick={() => handleNavigation("/creator")}
                    className="w-full text-left px-4 py-3 text-white font-semibold hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Creator
                  </button>
                  <button
                    onClick={() => handleNavigation("/contact")}
                    className="w-full text-left px-4 py-3 text-white font-semibold hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Support
                  </button>
                  <button
                    onClick={() => handleNavigation("/download")}
                    className="w-full text-left px-4 py-3 text-white font-semibold hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleNavigation("/privacy-policy")}
                    className="w-full text-left px-4 py-3 text-white font-semibold hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Privacy
                  </button>
                  <button
                    onClick={() => handleNavigation("/terms-of-service")}
                    className="w-full text-left px-4 py-3 text-white font-semibold hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    Terms
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}