import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      name: string;
      email: string;
      companyId?: string;
      companyName?: string;
      avatar?: string;
    } & DefaultSession['user'];
  }
}