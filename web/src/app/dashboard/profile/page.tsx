import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/components/dashboard/profile-settings-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { authOptions } from "@/lib/auth";
import { getDashboardSessionUser } from "@/lib/dashboard-data";
import { prisma } from "@/lib/prisma";

export default async function DashboardProfilePage() {
  const user = await getDashboardSessionUser();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      bio: true,
      avatarUrl: true,
      socialLinks: true,
    },
  });

  const links = (profile?.socialLinks as Record<string, unknown> | null) ?? null;

  return (
    <DashboardShell activeSection="profile" user={user}>
      <ProfileSettingsForm
        initial={{
          bio: profile?.bio ?? "",
          avatarUrl: profile?.avatarUrl ?? "",
          website: typeof links?.website === "string" ? links.website : "",
          whatsapp: typeof links?.whatsapp === "string" ? links.whatsapp : "",
          email: typeof links?.email === "string" ? links.email : "",
        }}
      />
    </DashboardShell>
  );
}
