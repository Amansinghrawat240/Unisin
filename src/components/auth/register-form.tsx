"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const RegisterForm = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Use Better-Auth for registration - session handled via cookies automatically
      const { data, error } = await authClient.signUp.email({
        email: form.email,
        password: form.password,
        name: form.name,
      });

      if (error?.code) {
        const errorMap: Record<string, string> = {
          USER_ALREADY_EXISTS: "Email already registered",
        };
        toast.error(errorMap[error.code] || "Registration failed");
        setLoading(false);
        return;
      }

      toast.success("Account created successfully!");
      
      // Redirect to home after successful registration
      router.push("/");
    } catch (_err) {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-0px)] flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-[#181818] border-[#2a2a2a] text-white">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold tracking-tight">Sign up to start listening</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Create your account to enjoy music and podcasts.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Your name"
                className="bg-[#242424] border-[#2a2a2a] text-white placeholder:text-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                placeholder="you@example.com"
                className="bg-[#242424] border-[#2a2a2a] text-white placeholder:text-zinc-400"
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
              <p className="text-xs text-muted-foreground">Use 8+ characters with a mix of letters, numbers, and symbols.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="off"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                required
                className="bg-[#242424] border-[#2a2a2a] text-white"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-[var(--color-primary)] text-black hover:opacity-90">
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          {/* Legal + login link */}
          <p className="mt-4 text-xs text-muted-foreground">
            By signing up, you agree to our Terms and acknowledge our Privacy Policy.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-white underline">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterForm;