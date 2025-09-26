import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function getSessionCompanyId() {
  const session = await getServerSession(authOptions) as any;
  if (!session || !session.user?.companyId) {
    throw new Error('Unauthorized: No companyId in session');
  }
  return session.user.companyId;
}
