import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-amber-50 via-white to-zinc-100 p-4">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-8 h-64 w-64 rounded-full bg-zinc-300/30 blur-3xl" />
      <RegisterForm />
    </main>
  );
}
