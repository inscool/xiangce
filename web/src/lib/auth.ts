import { Prisma, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          return null;
        }

        const normalized = credentials.identifier.trim();
        const normalizedEmail = normalized.toLowerCase();

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: normalizedEmail }, { username: normalized }],
          },
        });

        if (!user || !user.emailVerifiedAt) {
          return null;
        }

        const passwordValid = await bcrypt.compare(credentials.password, user.password);
        if (!passwordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = token.email ?? "";
        session.user.name = token.name ?? null;
        session.user.role = token.role ?? UserRole.USER;
        session.user.mustChangePassword = token.mustChangePassword ?? false;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function userExistsByUsernameOrEmail(username: string, email: string) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: email.toLowerCase() }],
    },
  });

  return Boolean(existingUser);
}

export async function createVerifiedUser(input: {
  username: string;
  email: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      username: input.username,
      email: input.email.toLowerCase(),
      password: input.passwordHash,
      role: UserRole.USER,
      mustChangePassword: false,
      storageLimit: BigInt(536870912),
      usedStorage: BigInt(0),
      emailVerifiedAt: new Date(),
    },
  });
}

export function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
