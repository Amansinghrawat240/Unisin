import TopNavigation from "@/components/sections/top-navigation";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <TopNavigation />
      <main className="flex items-center justify-center px-4 py-10">
        <RegisterForm />
      </main>
    </div>
  );
}