import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-100 via-white to-amber-50 p-4">
      <div className="pointer-events-none absolute -top-20 right-12 h-56 w-56 rounded-full bg-zinc-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-12 h-64 w-64 rounded-full bg-amber-200/35 blur-3xl" />
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
