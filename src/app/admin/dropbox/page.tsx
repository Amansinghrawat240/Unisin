"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

export default function DropboxSettingsPage() {
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/admin/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user?.email) return;
      
      try {
        const token = localStorage.getItem("bearer_token");
        const res = await fetch("/api/v1/admin/settings/dropbox_access_token", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-test-user-email": session.user.email
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.settingValue || "");
        } else if (res.status === 404) {
          // Setting doesn't exist yet, that's okay
          setAccessToken("");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setFetchingSettings(false);
      }
    };

    if (session?.user?.email) {
      fetchSettings();
    }
  }, [session?.user?.email]);

  const validateDropboxToken = (token: string): { valid: boolean; error?: string } => {
    // Trim whitespace
    const trimmed = token.trim();
    
    // Check if empty
    if (!trimmed) {
      return { valid: false, error: "Token cannot be empty" };
    }
    
    // Dropbox tokens should start with "sl." for user tokens or other prefixes
    if (!trimmed.startsWith("sl.") && !trimmed.startsWith("Bearer ")) {
      return { valid: false, error: "Invalid token format. Dropbox tokens typically start with 'sl.'" };
    }
    
    // Remove "Bearer " prefix if present
    const cleanToken = trimmed.replace(/^Bearer\s+/i, "");
    
    // Check length - modern Dropbox tokens can be quite long
    if (cleanToken.length < 50) {
      return { valid: false, error: "Token too short. Please check if you copied the complete token." };
    }
    
    if (cleanToken.length > 2000) {
      return { valid: false, error: "Token too long. Please ensure you only copied the access token once." };
    }
    
    // Check for duplicate content (token pasted twice)
    const halfLength = Math.floor(cleanToken.length / 2);
    const firstHalf = cleanToken.substring(0, halfLength);
    const secondHalf = cleanToken.substring(halfLength);
    if (firstHalf === secondHalf) {
      return { valid: false, error: "Token appears to be duplicated. Please paste it only once." };
    }
    
    return { valid: true };
  };

  const handleSave = async () => {
    if (!session?.user?.email) {
      toast.error("You must be logged in to save settings");
      return;
    }

    // Validate token
    const validation = validateDropboxToken(accessToken);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    
    // Clean the token
    const cleanToken = accessToken.trim().replace(/^Bearer\s+/i, "");
    
    setLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-test-user-email": session.user.email
        },
        body: JSON.stringify({
          settingKey: "dropbox_access_token",
          settingValue: cleanToken,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      toast.success("Dropbox settings saved successfully!");
      
      // Update the state with cleaned token
      setAccessToken(cleanToken);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    const validation = validateDropboxToken(accessToken);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    
    toast.info("Testing Dropbox connection...");
    
    try {
      // Create a test file to upload
      const testContent = "Test file from Unisin";
      const testBlob = new Blob([testContent], { type: "text/plain" });
      const testFile = new File([testBlob], "test.txt", { type: "text/plain" });
      
      const formData = new FormData();
      formData.append("file", testFile);
      
      const res = await fetch("/api/upload-to-dropbox", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Upload test failed");
      }
      
      const result = await res.json();
      toast.success("Dropbox connection successful! ✓");
      console.log("Test upload result:", result);
    } catch (error: any) {
      console.error("Test failed:", error);
      toast.error(`Connection test failed: ${error.message}`);
    }
  };

  if (isPending || fetchingSettings) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-zinc-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-zinc-400 hover:text-white mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold mb-2">Dropbox Settings</h1>
          <p className="text-zinc-400">
            Configure Dropbox integration for music file storage
          </p>
        </div>

        <div className="bg-[#181818] border border-white/10 rounded-lg p-6 space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">How to get your Dropbox Access Token:</h3>
            <ol className="text-sm text-zinc-300 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://www.dropbox.com/developers/apps" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Dropbox App Console</a></li>
              <li>Create a new app or select an existing one</li>
              <li>Navigate to the "Settings" tab</li>
              <li>Under "OAuth 2", find "Generated access token"</li>
              <li>Click "Generate" to create a token</li>
              <li>Copy the token and paste it below</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Dropbox Access Token
            </label>
            <textarea
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="sl.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#1db954] font-mono text-sm"
              rows={4}
            />
            <p className="text-xs text-zinc-500 mt-2">
              Token length: {accessToken.trim().length} characters
              {accessToken.trim().length > 2000 && (
                <span className="text-red-500 ml-2">❌ Token too long - max 2000 characters</span>
              )}
              {accessToken.trim().length > 0 && accessToken.trim().length < 50 && (
                <span className="text-yellow-500 ml-2">⚠ Token seems too short</span>
              )}
              {accessToken.trim().length >= 50 && accessToken.trim().length <= 2000 && (
                <span className="text-green-500 ml-2">✓ Token length looks good</span>
              )}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={loading || !accessToken.trim()}
              className="flex-1 bg-[#1db954] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
            <button
              onClick={handleTest}
              disabled={!accessToken.trim()}
              className="bg-blue-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Test Connection
            </button>
          </div>
        </div>

        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2">⚠ Important Notes:</h3>
          <ul className="text-sm text-zinc-300 space-y-1 list-disc list-inside">
            <li>Make sure you copy the <strong>entire token</strong> without any extra spaces</li>
            <li>Do not paste the token multiple times</li>
            <li>Remove any "Bearer " prefix if present</li>
            <li>Modern Dropbox tokens can be 50-2000 characters long</li>
            <li>Use the "Test Connection" button to verify the token works</li>
          </ul>
        </div>
      </div>
    </div>
  );
}