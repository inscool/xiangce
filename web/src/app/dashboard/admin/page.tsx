import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { AdminUsersConsole } from "@/components/admin/admin-users-console";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAdminDashboardData, getDashboardSessionUser } from "@/lib/dashboard-data";

export default async function DashboardAdminPage() {
  const user = await getDashboardSessionUser();

  if (user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const { adminUsers, userGroups } = await getAdminDashboardData(user.role);

  return (
    <DashboardShell activeSection="admin" user={user}>
      <AdminUsersConsole
        users={adminUsers.map((item) => ({
          id: item.id,
          username: item.username,
          email: item.email,
          role: item.role,
          usedStorageMb: Number(item.usedStorage / (1024n * 1024n)),
          storageLimitMb: Number(item.storageLimit / (1024n * 1024n)),
          groupId: item.groupId,
          groupBadgeLabel: item.group?.badgeLabel ?? null,
          groupBadgeColor: item.group?.badgeColor ?? null,
          groupBadgeIconUrl: item.group?.badgeIconUrl ?? null,
        }))}
        groups={userGroups.map((group) => ({
          id: group.id,
          name: group.name,
          storageLimitMb: Number(group.storageLimit / (1024n * 1024n)),
          badgeLabel: group.badgeLabel ?? null,
          badgeColor: group.badgeColor ?? null,
          badgeIconUrl: group.badgeIconUrl ?? null,
        }))}
      />
    </DashboardShell>
  );
}
