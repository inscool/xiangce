"use client";

import { UserRole } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  usedStorageMb: number;
  storageLimitMb: number;
  groupId: string | null;
};

type GroupItem = {
  id: string;
  name: string;
  storageLimitMb: number;
};

type Props = {
  users: AdminUser[];
  groups: GroupItem[];
};

type DraftState = Record<
  string,
  {
    role: UserRole;
    storageLimitMb: string;
    usedStorageMb: string;
  }
>;

export function AdminUsersConsole({ users, groups }: Props) {
  const router = useRouter();
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [assigningGroup, setAssigningGroup] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, true>>({});
  const [batchGroupId, setBatchGroupId] = useState<string>(groups[0]?.id ?? "");
  const [groupName, setGroupName] = useState("");
  const [groupStorageLimitMb, setGroupStorageLimitMb] = useState("512");
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", groupId: "" });

  const [drafts, setDrafts] = useState<DraftState>(() =>
    Object.fromEntries(
      users.map((user) => [
        user.id,
        {
          role: user.role,
          storageLimitMb: String(user.storageLimitMb),
          usedStorageMb: String(user.usedStorageMb),
        },
      ]),
    ),
  );

  function setUserMessage(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  }

  async function saveUser(userId: string) {
    const draft = drafts[userId];
    if (!draft) {
      return;
    }

    const storageLimitMb = Number(draft.storageLimitMb);
    const usedStorageMb = Number(draft.usedStorageMb);
    if (!Number.isFinite(storageLimitMb) || storageLimitMb <= 0) {
      setUserMessage("存储上限必须是大于 0 的数字。");
      return;
    }

    if (!Number.isFinite(usedStorageMb) || usedStorageMb < 0) {
      setUserMessage("已用空间必须是大于等于 0 的数字。");
      return;
    }

    setSavingUserId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: draft.role,
          storageLimitMb,
          usedStorageMb,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setUserMessage(data.error ?? "更新用户失败。");
        return;
      }

      setUserMessage("用户权限已更新。");
      router.refresh();
    } finally {
      setSavingUserId(null);
    }
  }

  async function createGroup() {
    const storageLimitMb = Number(groupStorageLimitMb);
    if (!groupName.trim()) {
      setUserMessage("用户组名称不能为空。");
      return;
    }
    if (!Number.isFinite(storageLimitMb) || storageLimitMb <= 0) {
      setUserMessage("用户组容量必须是大于 0 的数字。");
      return;
    }

    setCreatingGroup(true);
    try {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          storageLimitMb,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setUserMessage(data.error ?? "创建用户组失败。");
        return;
      }

      setGroupName("");
      setUserMessage("用户组已创建。");
      router.refresh();
    } finally {
      setCreatingGroup(false);
    }
  }

  async function assignUsersToGroup() {
    const userIds = Object.keys(selectedUsers);
    if (!userIds.length) {
      setUserMessage("请先选择至少一个用户。");
      return;
    }

    setAssigningGroup(true);
    try {
      const response = await fetch("/api/admin/users/batch-group", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds,
          groupId: batchGroupId || null,
        }),
      });

      const data = (await response.json()) as { error?: string; updated?: number };
      if (!response.ok) {
        setUserMessage(data.error ?? "批量分组失败。");
        return;
      }

      setSelectedUsers({});
      setUserMessage(`已更新 ${data.updated ?? userIds.length} 个用户。`);
      router.refresh();
    } finally {
      setAssigningGroup(false);
    }
  }

  async function createUser() {
    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      setUserMessage("用户名、邮箱和初始密码必填。");
      return;
    }

    setCreatingUser(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          groupId: newUser.groupId || null,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setUserMessage(data.error ?? "创建用户失败。");
        return;
      }

      setNewUser({ username: "", email: "", password: "", groupId: "" });
      setUserMessage("新用户已创建。");
      router.refresh();
    } finally {
      setCreatingUser(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>用户与分组管理</CardTitle>
        <CardDescription>创建用户、创建分组、批量分组并调整用户权限与容量。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}

        <div className="rounded-lg border border-zinc-200 p-3">
          <p className="mb-2 text-sm font-medium text-zinc-900">添加新用户</p>
          <div className="grid gap-2 lg:grid-cols-4">
            <Input
              value={newUser.username}
              onChange={(event) => setNewUser((prev) => ({ ...prev, username: event.target.value }))}
              placeholder="用户名"
            />
            <Input
              value={newUser.email}
              onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="邮箱"
            />
            <Input
              type="password"
              value={newUser.password}
              onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="初始密码"
            />
            <select
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
              value={newUser.groupId}
              onChange={(event) => setNewUser((prev) => ({ ...prev, groupId: event.target.value }))}
            >
              <option value="">不分组</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3">
            <Button type="button" onClick={createUser} disabled={creatingUser}>
              {creatingUser ? "创建中..." : "添加新用户"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 p-3">
          <p className="mb-2 text-sm font-medium text-zinc-900">创建用户组</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="例如：VIP" />
            <Input
              type="number"
              min={1}
              value={groupStorageLimitMb}
              onChange={(event) => setGroupStorageLimitMb(event.target.value)}
              placeholder="容量（MB）"
            />
            <Button type="button" onClick={createGroup} disabled={creatingGroup}>
              {creatingGroup ? "创建中..." : "创建用户组"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 p-3">
          <p className="mb-2 text-sm font-medium text-zinc-900">批量分配用户组</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm sm:max-w-xs"
              value={batchGroupId}
              onChange={(event) => setBatchGroupId(event.target.value)}
            >
              <option value="">不分组</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.storageLimitMb}MB)
                </option>
              ))}
            </select>
            <Button type="button" onClick={assignUsersToGroup} disabled={assigningGroup}>
              {assigningGroup ? "应用中..." : "应用到选中用户"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {users.map((user) => {
            const draft = drafts[user.id];
            return (
              <div key={user.id} className="rounded-lg border border-zinc-200 p-3">
                <div className="mb-3 flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={Boolean(selectedUsers[user.id])}
                    onChange={(event) => {
                      setSelectedUsers((prev) => {
                        const next = { ...prev };
                        if (event.target.checked) {
                          next[user.id] = true;
                        } else {
                          delete next[user.id];
                        }
                        return next;
                      });
                    }}
                  />
                  <div>
                    <p className="font-medium text-zinc-900">
                      @{user.username} <span className="text-zinc-500">({user.email})</span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      分组：{groups.find((group) => group.id === user.groupId)?.name ?? "未分组"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-1 text-sm">
                    <span className="text-zinc-600">角色</span>
                    <select
                      className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3"
                      value={draft.role}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [user.id]: {
                            ...prev[user.id],
                            role: event.target.value as UserRole,
                          },
                        }))
                      }
                    >
                      <option value={UserRole.USER}>USER</option>
                      <option value={UserRole.ADMIN}>ADMIN</option>
                    </select>
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="text-zinc-600">存储上限（MB）</span>
                    <Input
                      type="number"
                      min={1}
                      value={draft.storageLimitMb}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [user.id]: {
                            ...prev[user.id],
                            storageLimitMb: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="text-zinc-600">已用空间（MB）</span>
                    <Input
                      type="number"
                      min={0}
                      value={draft.usedStorageMb}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [user.id]: {
                            ...prev[user.id],
                            usedStorageMb: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="mt-3">
                  <Button type="button" onClick={() => saveUser(user.id)} disabled={savingUserId === user.id}>
                    {savingUserId === user.id ? "保存中..." : "保存用户"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
