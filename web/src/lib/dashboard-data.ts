import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getDashboardSessionUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      role: true,
      group: {
        select: {
          name: true,
        },
      },
      mustChangePassword: true,
      usedStorage: true,
      storageLimit: true,
      _count: {
        select: {
          albums: true,
          images: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getDashboardAlbums(userId: string) {
  return prisma.album.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      shortId: true,
      title: true,
      description: true,
      category: true,
      visibility: true,
      images: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          cdnUrl: true,
          storageKey: true,
          fileSize: true,
          albumId: true,
        },
      },
    },
  });
}

export async function getDashboardImages(userId: string) {
  return prisma.image.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      cdnUrl: true,
      storageKey: true,
      fileSize: true,
      albumId: true,
    },
  });
}

export async function getAdminDashboardData(role: UserRole) {
  if (role !== UserRole.ADMIN) {
    return { adminUsers: [], userGroups: [] };
  }

  const [adminUsers, userGroups] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        usedStorage: true,
        storageLimit: true,
        groupId: true,
      },
    }),
    prisma.userGroup.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        storageLimit: true,
      },
    }),
  ]);

  return { adminUsers, userGroups };
}

export async function getDashboardInquiries(userId: string, role: UserRole) {
  const where = role === UserRole.ADMIN ? {} : { userId };

  return prisma.inquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      ipAddress: true,
      message: true,
      status: true,
      processedAt: true,
      createdAt: true,
      user: {
        select: {
          username: true,
        },
      },
    },
  });
}

export async function getDashboardInquiryStats(userId: string, role: UserRole) {
  const where = role === UserRole.ADMIN ? {} : { userId };

  const [newInquiries, totalInquiries] = await Promise.all([
    prisma.inquiry.count({ where: { ...where, status: "NEW" } }),
    prisma.inquiry.count({ where }),
  ]);

  return { newInquiries, totalInquiries };
}
