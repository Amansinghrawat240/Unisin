"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const LoginForm = () => {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [form, setForm] = useState({ identifier: "", password: "", rememberMe: true });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Use Better-Auth for login - session handled via cookies automatically
      const { data, error } = await authClient.signIn.email({
        email: form.identifier,
        password: form.password,
        rememberMe: form.rememberMe,
      });

      if (error?.code) {
        toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
        setLoading(false);
        return;
      }

      toast.success("Welcome back!");
      
      // Redirect to target page
      router.push(redirect);
    } catch (_err) {
      console.error("[LOGIN] Error:", _err);
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-0px)] flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-[#181818] border-[#2a2a2a] text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Log in</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Access your music</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or username</Label>
              <Input
                id="identifier"
                type="text"
                value={form.identifier}
                onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
                required
                placeholder="you@example.com or yourusername"
                className="bg-[#242424] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="off"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                className="bg-[#242424] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={form.rememberMe}
                onCheckedChange={(v) => setForm((f) => ({ ...f, rememberMe: Boolean(v) }))}
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground">Remember me</Label>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-[var(--color-primary)] text-black hover:opacity-90">
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Don&apos;t have an account? <Link href="/register" className="text-white underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
