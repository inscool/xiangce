import { UserRole } from "@prisma/client";

import { AdminInquiriesConsole } from "@/components/admin/admin-inquiries-console";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardInquiries, getDashboardSessionUser } from "@/lib/dashboard-data";

export default async function DashboardInquiriesPage() {
  const user = await getDashboardSessionUser();
  const inquiries = await getDashboardInquiries(user.id, user.role);

  return (
    <DashboardShell activeSection="inquiries" user={user}>
      <AdminInquiriesConsole
        mode={user.role === UserRole.ADMIN ? "admin" : "user"}
        inquiries={inquiries.map((item) => ({
          id: item.id,
          username: item.user.username,
          name: item.name,
          email: item.email,
          whatsapp: item.whatsapp,
          ipAddress: item.ipAddress,
          message: item.message,
          status: item.status,
          processedAt: item.processedAt ? item.processedAt.toISOString() : null,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </DashboardShell>
  );
}
