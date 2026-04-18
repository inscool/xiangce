"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InquiryItem = {
  id: string;
  username: string;
  name: string | null;
  email: string;
  whatsapp: string | null;
  ipAddress: string | null;
  message: string;
  status: "NEW" | "PROCESSED";
  processedAt: string | null;
  createdAt: string;
};

type Props = {
  mode: "admin" | "user";
  inquiries: InquiryItem[];
};

export function AdminInquiriesConsole({ mode, inquiries }: Props) {
  const router = useRouter();
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function notify(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  }

  async function updateStatus(id: string, status: "NEW" | "PROCESSED") {
    setWorkingId(id);
    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        notify(data.error ?? "更新状态失败。");
        return;
      }

      notify(status === "PROCESSED" ? "已标记为已处理。" : "已标记为待处理。");
      router.refresh();
    } finally {
      setWorkingId(null);
    }
  }

  async function removeInquiry(id: string) {
    setWorkingId(id);
    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        notify(data.error ?? "删除留言失败。");
        return;
      }

      notify("留言已删除。");
      router.refresh();
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "admin" ? "全局留言管理" : "我的留言"}</CardTitle>
        <CardDescription>
          {mode === "admin" ? "查看全站客户询盘，标记处理状态，或删除无效留言。" : "查看提交给你主页和相册的客户留言。"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}

        {inquiries.length === 0 ? (
          <p className="text-sm text-zinc-500">暂无留言。</p>
        ) : (
          inquiries.map((item) => (
            <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  {mode === "admin" ? <p className="text-sm text-zinc-500">@{item.username}</p> : null}
                  <p className="text-sm text-zinc-800">
                    {item.name || "(未填写姓名)"} · {item.email}
                  </p>
                  <p className="text-sm text-zinc-600">WhatsApp: {item.whatsapp || "未填写"}</p>
                  <p className="text-sm text-zinc-600">IP: {item.ipAddress || "未知"}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(item.createdAt).toLocaleString()} · {item.status === "NEW" ? "待处理" : "已处理"}
                  </p>
                </div>

                {mode === "admin" ? (
                  <div className="flex flex-wrap gap-2">
                    {item.status === "NEW" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => updateStatus(item.id, "PROCESSED")}
                        disabled={workingId === item.id}
                      >
                        标记已处理
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(item.id, "NEW")}
                        disabled={workingId === item.id}
                      >
                        标记待处理
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeInquiry(item.id)}
                      disabled={workingId === item.id}
                    >
                      删除
                    </Button>
                  </div>
                ) : null}
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">{item.message}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
