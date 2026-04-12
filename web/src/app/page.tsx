import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-zinc-100 via-white to-amber-50 p-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Photo Album Platform</h1>
      <p className="max-w-xl text-zinc-600">Credentials auth and SMTP email verification are ready. Create an account to start.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/register">Create Account</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
