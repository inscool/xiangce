"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  albumId: string;
  albumTitle: string;
};

export function AlbumProtectedGate({ albumId, albumTitle }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-amber-50 pb-10">
      <section className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Protected Album</CardTitle>
            <CardDescription>Enter password to access &quot;{albumTitle}&quot;.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setLoading(true);

                const form = new FormData(event.currentTarget);
                const password = String(form.get("password") ?? "");

                try {
                  const response = await fetch(`/api/albums/${albumId}/unlock`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password }),
                  });

                  const data = (await response.json()) as { error?: string; message?: string };
                  if (!response.ok) {
                    toast.error(data.error ?? "Failed to unlock album.");
                    return;
                  }

                  toast.success(data.message ?? "Album unlocked.");
                  router.refresh();
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="password">Album Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Unlocking..." : "Unlock Album"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
