import { ChangePasswordCard } from "@/components/dashboard/change-password-card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SystemSettingsForm } from "@/components/dashboard/system-settings-form";
import { getDashboardSessionUser } from "@/lib/dashboard-data";

export default async function DashboardSettingsPage() {
  const user = await getDashboardSessionUser();

  return (
    <DashboardShell activeSection="settings" user={user}>
      <ChangePasswordCard forceNotice={user.mustChangePassword} />
      {user.role === "ADMIN" ? <SystemSettingsForm /> : null}
    </DashboardShell>
  );
}
