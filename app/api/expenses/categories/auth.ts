import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

export async function getSessionCompanyId() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session || !session.user?.companyId) {
    throw new Error('Awood uma lihid. companyId lama helin.');
  }
  return session.user.companyId;
}
