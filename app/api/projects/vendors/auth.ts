// app/api/vendors/auth.ts - Authentication helper for vendors API
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getSessionCompanyId(): Promise<string> {
  const session = (await getServerSession(authOptions)) as Session | null;
  
  if (!session?.user?.companyId) {
    throw new Error('Awood uma lihid. Fadlan soo gal.');
  }
  
  return session.user.companyId;
}

export async function getSessionCompanyUser() {
  const session = (await getServerSession(authOptions)) as Session | null;
  
  if (!session?.user) {
    throw new Error('Awood uma lihid. Fadlan soo gal.');
  }
  
  return {
    userId: session.user.id,
    companyId: session.user.companyId,
    role: session.user.role,
  };
}