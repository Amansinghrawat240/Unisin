import { Suspense } from "react";
import TopNavigation from "@/components/sections/top-navigation";
import { LoginForm } from "@/components/auth/login-form";

function LoginFormWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md h-96 bg-[#181818] border border-[#2a2a2a] rounded-lg animate-pulse"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <TopNavigation />
      <main className="flex items-center justify-center px-4 py-10">
        <LoginFormWrapper />
      </main>
    </div>
  );
}