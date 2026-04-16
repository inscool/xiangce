import Link from "next/link";
import { UserRole } from "@prisma/client";
import { Cog, FolderKanban, Gauge, Users } from "lucide-react";

import { SidebarStorageMini } from "@/components/dashboard/sidebar-storage-mini";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { APP_VERSION } from "@/lib/version";

export const dashboardSections = [
  { key: "dashboard", label: "仪表盘", icon: Gauge, href: "/dashboard" },
  { key: "albums", label: "所有相册", icon: FolderKanban, href: "/dashboard/albums" },
  { key: "admin", label: "用户 / 分组", icon: Users, href: "/dashboard/admin" },
  { key: "settings", label: "系统设置", icon: Cog, href: "/dashboard/settings" },
] as const;

type Props = {
  activeSection: (typeof dashboardSections)[number]["key"];
  user: {
    username: string;
    role: UserRole;
    usedStorage: bigint;
    storageLimit: bigint;
  };
  children: React.ReactNode;
};

export function DashboardShell({ activeSection, user, children }: Props) {
  return (
    <main className="min-h-screen bg-zinc-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col justify-between border-r border-white/10 bg-zinc-950 px-5 py-6 text-zinc-100 lg:flex">
          <div className="space-y-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Opencode</p>
                <h1 className="text-2xl font-semibold text-white">Xiangce</h1>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">@{user.username}</p>
                <p className="mt-1 text-xs text-zinc-400">{user.role === UserRole.ADMIN ? "管理员" : "工作台用户"}</p>
                <div className="mt-3">
                  <Button asChild size="sm" variant="secondary" className="w-full">
                    <Link href={`/${user.username}`}>查看公开主页</Link>
                  </Button>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              {dashboardSections.map((item) => {
                if (item.key === "admin" && user.role !== UserRole.ADMIN) {
                  return null;
                }

                const Icon = item.icon;
                const active = activeSection === item.key;

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                      active ? "bg-white text-zinc-950" : "text-zinc-300 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto pt-6">
            <SidebarStorageMini usedStorage={user.usedStorage} storageLimit={user.storageLimit} />
            <p className="mt-4 text-center text-xs text-zinc-500">版本 {APP_VERSION}</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          <ScrollArea className="h-[calc(100vh-2.5rem)]">
            <div className="mx-auto max-w-[1600px] space-y-6 pr-2">
              {children}
            </div>
          </ScrollArea>
        </section>
      </div>
    </main>
  );
}
