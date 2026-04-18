import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StorageProgress } from "@/components/dashboard/storage-progress";
import { formatBytePercent, formatBytes } from "@/lib/format";
import { getDashboardInquiryStats, getDashboardSessionUser } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const user = await getDashboardSessionUser();
  const inquiryStats = await getDashboardInquiryStats(user.id, user.role);
  const usedPercent = formatBytePercent(user.usedStorage, user.storageLimit);
  const groupLabel = user.group?.name ? `${user.group.name} 账户` : "免费账户";

  return (
    <DashboardShell
      activeSection="dashboard"
      user={user}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard
          label="新增留言"
          value={String(inquiryStats.newInquiries)}
          helper={`累计 ${inquiryStats.totalInquiries} 条留言`}
          accent="pulse"
        />
        <DashboardStatCard
          label="相册数量"
          value={String(user._count.albums)}
          helper={`共 ${user._count.images} 张图片`}
        />
        <DashboardStatCard
          label="图片数量"
          value={String(user._count.images)}
          helper="包含所有相册内与工作区图片"
        />
        <DashboardStatCard
          label="空间使用"
          value={`${formatBytes(user.usedStorage)} / ${formatBytes(user.storageLimit)}`}
          helper={`已使用 ${usedPercent}%`}
        />
        <DashboardStatCard
          label="账户信息"
          value={groupLabel}
          helper={user.role === "ADMIN" ? "已启用管理员权限" : "当前按用户组策略分配容量"}
        />
      </div>

      <StorageProgress usedStorage={user.usedStorage} storageLimit={user.storageLimit} />
    </DashboardShell>
  );
}
