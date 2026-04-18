import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { AdminInquiriesConsole } from "@/components/admin/admin-inquiries-console";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAdminInquiries, getDashboardSessionUser } from "@/lib/dashboard-data";

export default async function DashboardInquiriesPage() {
  const user = await getDashboardSessionUser();

  if (user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const inquiries = await getAdminInquiries(user.role);

  return (
    <DashboardShell activeSection="inquiries" user={user}>
      <AdminInquiriesConsole
        inquiries={inquiries.map((item) => ({
          id: item.id,
          username: item.user.username,
          name: item.name,
          email: item.email,
          whatsapp: item.whatsapp,
          message: item.message,
          status: item.status,
          processedAt: item.processedAt ? item.processedAt.toISOString() : null,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </DashboardShell>
  );
}
