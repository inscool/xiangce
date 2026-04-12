"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  forceNotice?: boolean;
};

export function ChangePasswordCard({ forceNotice = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Change your current account password.</CardDescription>
        {forceNotice ? <p className="text-sm text-amber-700">For security, you must change the default password now.</p> : null}
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            setMessage(null);
            setError(null);

            const form = new FormData(event.currentTarget);
            const payload = {
              currentPassword: String(form.get("currentPassword") ?? ""),
              newPassword: String(form.get("newPassword") ?? ""),
              confirmPassword: String(form.get("confirmPassword") ?? ""),
            };

            try {
              const response = await fetch("/api/account/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              const data = (await response.json()) as { message?: string; error?: string };
              if (!response.ok) {
                setError(data.error ?? "Failed to update password.");
                return;
              }

              setMessage(data.message ?? "Password updated.");
              event.currentTarget.reset();
              if (forceNotice) {
                window.location.reload();
              }
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" name="newPassword" type="password" minLength={8} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
