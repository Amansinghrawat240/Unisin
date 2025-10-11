import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="mt-12 pt-8 pb-8 border-t border-white/10">
      <div className="container">
        <div className="flex flex-wrap text-xs gap-y-2 gap-x-4 mb-4">
          <a
            href="/terms-of-service"
            className="text-muted-foreground hover:underline hover:text-white transition-colors"
          >
            Terms of Service
          </a>
          <a
            href="/contact"
            className="text-muted-foreground hover:underline hover:text-white transition-colors"
          >
            Contact Us
          </a>
          <a
            href="/privacy-policy"
            className="text-muted-foreground hover:underline hover:text-white transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="/faq"
            className="text-muted-foreground hover:underline hover:text-white transition-colors"
          >
            FAQ / Help Center
          </a>
          <a
            href="/about"
            className="text-muted-foreground hover:underline hover:text-white transition-colors"
          >
            About Us 
          </a>
          <a
            href="/careers"
            className="text-muted-foreground hover:underline hover:text-white transition-colors"
          >
            Careers
          </a>
          <a
            href="/press"
            className="text-muted-foreground hover:underline hover:text-white transition-colors"
          >
            Press
          </a>
          <a
            href="/accessibility"
            className="text-muted-foreground hover:underline hover:text-white transition-colors"
          >
            Accessibility
          </a>
        </div>

        <Button
          variant="outline"
          className="border-muted-foreground/50 text-white rounded-full py-1 px-3 text-sm font-bold h-8 items-center gap-1 hover:border-white hover:scale-105 transition-transform"
        >
          <Globe className="h-4 w-4" />
          English
        </Button>
      </div>
    </footer>
  );
}