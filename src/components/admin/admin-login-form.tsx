"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const AdminLoginForm = () => {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/@gmail\.com$/i.test(form.email)) {
      toast.error("Only Gmail addresses are allowed for admin access.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const map: Record<string, string> = {
          MISSING_CREDENTIALS: "Please enter email and password",
          EMAIL_NOT_ALLOWED: "Only Gmail addresses are allowed",
          INVALID_CREDENTIALS: "Invalid admin email or password",
        };
        toast.error(map[data?.error] || "Admin login failed");
        setLoading(false);
        return;
      }

      // Persist admin session client-side
      if (data?.token) localStorage.setItem("admin_token", data.token);
      if (data?.user?.email) localStorage.setItem("admin_email", data.user.email);

      // For moderation API compatibility (expects any Bearer + x-test-user-email)
      if (data?.token) localStorage.setItem("bearer_token", data.token);

      toast.success("Admin logged in");
      router.push("/admin/moderation");
    } catch (err) {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full bg-[#181818] border-[#2a2a2a] text-white">
      <CardHeader>
        <CardTitle className="text-2xl">Admin login</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Use the Gmail and password configured in environment variables
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Admin Gmail</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              placeholder="you@gmail.com"
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
          <Button type="submit" disabled={loading} className="w-full bg-[var(--color-primary)] text-black hover:opacity-90">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">
          Configure ADMIN_ADMINS and ADMIN_SECRET in your env. Example: email1@gmail.com:pass1,email2@gmail.com:pass2
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminLoginForm;