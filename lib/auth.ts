// lib/auth.ts - Authentication Helpers (NextAuth.js Integration - FINAL FIX)
import type { Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from './db'; 
import bcrypt from 'bcryptjs'; 
import { USER_ROLES } from './constants'; 
import { getServerSession } from "next-auth/next";

// Hubi in env variables-ka ay jiraan
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set in environment variables');
}
// Hubi in NEXTAUTH_URL uu jiro. Tani waa muhiim!
if (!process.env.NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL is not set in environment variables. Please add it to your .env file.');
}


declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      name: string;
      email: string;
      companyName?: string;
      companyId?: string;
    };
  }
}

export const authOptions: any = {
  adapter: PrismaAdapter(prisma), 
  
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null; 
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            company: {
              select: { id: true, name: true }
            }
          }
        });

        if (!user) {
          return null; 
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          return null; 
        }

        if (user.status === 'Inactive') {
          throw new Error("Akoonkaagu waa la damiyay. Fadlan la xiriir maamulaha.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName, 
          role: user.role, 
          companyName: user.company?.name, 
          companyId: user.company?.id,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt', 
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  pages: {
    signIn: '/login', 
    error: '/login', 
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        const customUser = user as any; 

        token.id = customUser.id;
        token.role = customUser.role;
        token.name = customUser.name; 
        token.email = customUser.email; 
        if (customUser.companyName) {
          token.companyName = customUser.companyName;
        }
        if (customUser.companyId) {
          token.companyId = customUser.companyId;
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) { 
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string; 
        session.user.email = token.email as string; 
        if (token.companyName) {
          session.user.companyName = token.companyName as string;
        }
        if (token.companyId) {
          session.user.companyId = token.companyId as string;
        }
      }
      return session;
    },
    // MUHIIM: Hagaajinta redirect callback
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Haddii URL-ka uu yahay bogga login-ka ama qaladka authentication-ka,
      // si toos ah ugu gudbi dashboard-ka.
      if (url === `${baseUrl}/login` || url.startsWith(`${baseUrl}/api/auth/error`)) {
        return `${baseUrl}/dashboard`;
      }
      // Haddii kale, haddii URL-ku uu yahay mid ammaan ah oo gudaha ah, u gudbi halkaas.
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Haddii kale, u gudbi dashboard-ka default ahaan.
      return `${baseUrl}/dashboard`;
    }
  },
  secret: process.env.NEXTAUTH_SECRET, 
};

// NextAuth should not be called directly in app directory (Next.js 13+)
// Instead, export only authOptions and use in [...nextauth].ts API route

export const isAdmin = (userRole: string): boolean => {
  return userRole === USER_ROLES.ADMIN;
};

export const isManagerOrAdmin = (userRole: string): boolean => {
  return userRole === USER_ROLES.MANAGER || userRole === USER_ROLES.ADMIN;
};

// Mustaqbalka, waxaad halkan ku isticmaali kartaa getServerSession si aad u hesho user-ka server-side
// import { getServerSession } from "next-auth";
// export const getCurrentUser = async () => {
//   const session = await getServerSession(authOptions);
//   return session?.user;
// };

// Helper to get companyId and userId from session (for API routes)
export async function getSessionCompanyUser() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session) {
    return null; // Return null instead of throwing error
  }
  if (!session.user?.companyId) {
    return null; // Return null instead of throwing error
  }
  if (!session.user?.id) {
    return null; // Return null instead of throwing error
  }
  return { companyId: session.user.companyId, userId: session.user.id };
}
