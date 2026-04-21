"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  initial: {
    bio: string;
    avatarUrl: string;
    website: string;
    whatsapp: string;
    email: string;
  };
};

export function ProfileSettingsForm({ initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function uploadAvatar(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const payload = new FormData();
      payload.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: payload,
      });

      const data = (await response.json()) as { error?: string; avatarUrl?: string };
      if (!response.ok || !data.avatarUrl) {
        setMessage(data.error ?? "头像上传失败");
        return;
      }

      setForm((prev) => ({ ...prev, avatarUrl: data.avatarUrl ?? prev.avatarUrl }));
      setMessage("头像已上传，记得点保存资料。");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "保存失败");
        return;
      }

      setMessage("已保存");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-900">主页资料设置</h2>
      <p className="mt-1 text-sm text-zinc-600">设置头像、简介和联系方式入口（Website / WhatsApp / Email）。</p>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">头像链接（Avatar URL）</label>
          <Input value={form.avatarUrl} onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))} placeholder="https://..." />
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void uploadAvatar(file);
                }
                e.target.value = "";
              }}
              className="max-w-sm"
            />
            <span className="text-xs text-zinc-500">{uploading ? "上传中..." : "可直接上传头像"}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">个人简介（Bio）</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            maxLength={240}
            className="min-h-24 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            placeholder="写点你的业务介绍"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">Website</label>
          <Input value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} placeholder="https://your-site.com" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">WhatsApp</label>
          <Input value={form.whatsapp} onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))} placeholder="+86... 或 wa.me/..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">Contact Email</label>
          <Input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="contact@your-domain.com" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button type="button" onClick={save} disabled={saving}>{saving ? "保存中..." : "保存资料"}</Button>
        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      </div>
    </section>
  );
}
