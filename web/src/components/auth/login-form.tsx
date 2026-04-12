"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const verificationMessages: Record<string, string> = {
  success: "Email verified. You can now log in.",
  expired: "Verification link expired. Please register again.",
  invalid: "Invalid verification link.",
  duplicate: "This email is already verified. Please log in.",
  error: "Email verification failed. Try again.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifiedStatus = searchParams.get("verified");
  const verifiedMessage = useMemo(() => {
    if (!verifiedStatus) {
      return null;
    }

    return verificationMessages[verifiedStatus] ?? null;
  }, [verifiedStatus]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const identifier = String(formData.get("identifier") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (!result || result.error) {
      setError("Invalid credentials or unverified email.");
      setLoading(false);
      return;
    }

    window.location.href = result.url ?? "/";
  }

  return (
    <Card className="w-full max-w-md border-zinc-200/80">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>Log in with your email or username and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await handleSubmit(new FormData(event.currentTarget));
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="identifier">Email or Username</Label>
            <Input id="identifier" name="identifier" placeholder="you@example.com or yourname" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>

          {verifiedMessage ? <p className="text-sm text-emerald-700">{verifiedMessage}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-600">
          New here?{" "}
          <Link href="/register" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
            Create account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
