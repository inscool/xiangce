"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type State = {
  smtp: {
    host: string;
    port: string;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  };
  storage: {
    driver: "local" | "s3";
    localUploadDir: string;
    s3Region: string;
    s3Bucket: string;
    s3Endpoint: string;
    s3AccessKeyId: string;
    s3SecretAccessKey: string;
    s3ForcePathStyle: boolean;
    cdnBaseUrl: string;
  };
};

const defaultState: State = {
  smtp: {
    host: "",
    port: "587",
    secure: false,
    user: "",
    pass: "",
    from: "",
  },
  storage: {
    driver: "local",
    localUploadDir: "public/uploads",
    s3Region: "auto",
    s3Bucket: "",
    s3Endpoint: "",
    s3AccessKeyId: "",
    s3SecretAccessKey: "",
    s3ForcePathStyle: false,
    cdnBaseUrl: "",
  },
};

export function SystemSettingsForm() {
  const [state, setState] = useState<State>(defaultState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/settings");
      const data = (await response.json()) as Partial<State> & { error?: string };
      if (response.ok) {
        setState({
          smtp: { ...defaultState.smtp, ...(data.smtp ?? {}) },
          storage: { ...defaultState.storage, ...(data.storage ?? {}) },
        });
      }
      setLoading(false);
    }

    void load();
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      setMessage(data.message ?? data.error ?? "Saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">正在加载设置...</p>;
  }

  return (
    <div className="space-y-6">
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>SMTP 设置</CardTitle>
          <CardDescription>在后台保存邮件服务配置，用于注册验证和通知发送。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={state.smtp.host} onChange={(e) => setState((p) => ({ ...p, smtp: { ...p.smtp, host: e.target.value } }))} placeholder="SMTP 主机" />
          <Input value={state.smtp.port} onChange={(e) => setState((p) => ({ ...p, smtp: { ...p.smtp, port: e.target.value } }))} placeholder="SMTP 端口" />
          <Input value={state.smtp.user} onChange={(e) => setState((p) => ({ ...p, smtp: { ...p.smtp, user: e.target.value } }))} placeholder="SMTP 用户名" />
          <Input type="password" value={state.smtp.pass} onChange={(e) => setState((p) => ({ ...p, smtp: { ...p.smtp, pass: e.target.value } }))} placeholder="SMTP 密码" />
          <Input value={state.smtp.from} onChange={(e) => setState((p) => ({ ...p, smtp: { ...p.smtp, from: e.target.value } }))} placeholder="发件人 From" />
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={state.smtp.secure}
              onChange={(e) => setState((p) => ({ ...p, smtp: { ...p.smtp, secure: e.target.checked } }))}
            />
            启用安全 SMTP
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>存储设置</CardTitle>
          <CardDescription>可在网页端切换本地存储和 S3 / OSS / R2 存储模式。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
            value={state.storage.driver}
            onChange={(e) => setState((p) => ({ ...p, storage: { ...p.storage, driver: e.target.value as "local" | "s3" } }))}
          >
            <option value="local">本地存储</option>
            <option value="s3">S3 / OSS / R2</option>
          </select>

          {state.storage.driver === "local" ? (
            <Input
              value={state.storage.localUploadDir}
              onChange={(e) => setState((p) => ({ ...p, storage: { ...p.storage, localUploadDir: e.target.value } }))}
              placeholder="本地上传目录"
            />
          ) : (
            <div className="space-y-3">
              <Input value={state.storage.s3Region} onChange={(e) => setState((p) => ({ ...p, storage: { ...p.storage, s3Region: e.target.value } }))} placeholder="S3 区域 Region" />
              <Input value={state.storage.s3Bucket} onChange={(e) => setState((p) => ({ ...p, storage: { ...p.storage, s3Bucket: e.target.value } }))} placeholder="S3 Bucket" />
              <Input value={state.storage.s3Endpoint} onChange={(e) => setState((p) => ({ ...p, storage: { ...p.storage, s3Endpoint: e.target.value } }))} placeholder="S3 Endpoint" />
              <Input value={state.storage.s3AccessKeyId} onChange={(e) => setState((p) => ({ ...p, storage: { ...p.storage, s3AccessKeyId: e.target.value } }))} placeholder="Access Key ID" />
              <Input type="password" value={state.storage.s3SecretAccessKey} onChange={(e) => setState((p) => ({ ...p, storage: { ...p.storage, s3SecretAccessKey: e.target.value } }))} placeholder="Secret Access Key" />
              <Input value={state.storage.cdnBaseUrl} onChange={(e) => setState((p) => ({ ...p, storage: { ...p.storage, cdnBaseUrl: e.target.value } }))} placeholder="CDN 域名（可选）" />
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={state.storage.s3ForcePathStyle}
                  onChange={(e) => setState((p) => ({ ...p, storage: { ...p.storage, s3ForcePathStyle: e.target.checked } }))}
                />
                启用 Force Path Style
              </label>
            </div>
          )}

          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "保存中..." : "保存设置"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
