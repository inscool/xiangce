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

  function formatTime(value: string) {
    return new Date(value).toLocaleString();
  }

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
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-[1040px] w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  {mode === "admin" ? <th className="px-4 py-3 text-left font-semibold">归属用户</th> : null}
                  <th className="px-4 py-3 text-left font-semibold">姓名</th>
                  <th className="px-4 py-3 text-left font-semibold">邮箱</th>
                  <th className="px-4 py-3 text-left font-semibold">WhatsApp</th>
                  <th className="px-4 py-3 text-left font-semibold">IP</th>
                  <th className="px-4 py-3 text-left font-semibold">留言内容</th>
                  <th className="px-4 py-3 text-left font-semibold">留言时间</th>
                  <th className="px-4 py-3 text-left font-semibold">状态</th>
                  {mode === "admin" ? <th className="px-4 py-3 text-left font-semibold">操作</th> : null}
                </tr>
              </thead>
              <tbody>
                {inquiries.map((item) => (
                  <tr key={item.id} className="border-t border-zinc-100 align-top">
                    {mode === "admin" ? <td className="px-4 py-3 text-zinc-700">@{item.username}</td> : null}
                    <td className="px-4 py-3 text-zinc-900">{item.name || "(未填写姓名)"}</td>
                    <td className="px-4 py-3 text-zinc-700">{item.email}</td>
                    <td className="px-4 py-3 text-zinc-700">{item.whatsapp || "未填写"}</td>
                    <td className="px-4 py-3 text-zinc-700">{item.ipAddress || "未知"}</td>
                    <td className="max-w-lg px-4 py-3 text-zinc-700">
                      <p className="line-clamp-3 whitespace-pre-wrap break-all">{item.message}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatTime(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.status === "NEW" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {item.status === "NEW" ? "待处理" : "已处理"}
                      </span>
                    </td>
                    {mode === "admin" ? (
                      <td className="px-4 py-3">
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
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
