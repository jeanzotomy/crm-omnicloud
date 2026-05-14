import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { MemberRole } from '@prisma/client';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    // Microsoft Entra ID (configured via AZURE_AD_* env vars — optional)
    ...(process.env.AZURE_AD_CLIENT_ID
      ? [MicrosoftEntraID({
          clientId: process.env.AZURE_AD_CLIENT_ID,
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
          issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID ?? 'common'}/v2.0`,
          authorization: { params: { scope: 'openid email profile User.Read' } },
        })]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            orgMemberships: {
              orderBy: { joinedAt: 'asc' },
              take: 1,
              select: { organizationId: true, role: true },
            },
          },
        });

        if (!user?.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!valid) return null;

        const primaryOrg = user.orgMemberships[0];
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: primaryOrg?.organizationId ?? null,
          orgRole: primaryOrg?.role ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {

      // Auto-provision Entra ID users on first login
      if (account?.provider === 'microsoft-entra-id' && user.email) {
        let dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: 'AGENT',
            },
          });
          // Attach to default org
          const org = await prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } });
          if (org) {
            await prisma.organizationMember.create({
              data: { organizationId: org.id, userId: dbUser.id, role: MemberRole.AGENT },
            });
          }
        }
        user.id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as { id?: string; role?: string; organizationId?: string | null; orgRole?: string | null };
        token.id = u.id;
        token.role = u.role;
        token.organizationId = u.organizationId ?? null;
        token.orgRole = u.orgRole ?? null;
      }
      // For Entra ID logins: load org on first token creation if not yet set
      if (!token.organizationId && token.id) {
        const membership = await prisma.organizationMember.findFirst({
          where: { userId: token.id as string },
          orderBy: { joinedAt: 'asc' },
          select: { organizationId: true, role: true },
        });
        if (membership) {
          token.organizationId = membership.organizationId;
          token.orgRole = membership.role;
        }
        if (!token.role) {
          const dbUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: { role: true } });
          if (dbUser) token.role = dbUser.role;
        }
      }
      // Load enabled modules — refreshed on login and when admin calls session.update()
      if (user || trigger === 'update' || token.enabledModules === undefined) {
        if (token.organizationId) {
          const mods = await prisma.organizationModule.findMany({
            where: { organizationId: token.organizationId as string, enabled: true },
            select: { module: true },
          });
          token.enabledModules = mods.map(m => m.module as string);
        } else {
          token.enabledModules = [];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = (token.organizationId as string | null) ?? null;
        session.user.orgRole = (token.orgRole as string | null) ?? null;
        session.user.enabledModules = (token.enabledModules as string[]) ?? [];
      }
      return session;
    },
  },
});
