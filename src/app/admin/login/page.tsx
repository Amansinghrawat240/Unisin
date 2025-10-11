import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] p-6 text-white bg-gradient-to-b from-[#1a1a1a] to-[#121212]">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold">Admin • Login</h1>
        <AdminLoginForm />
      </div>
    </main>
  );
}