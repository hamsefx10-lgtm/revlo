import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function getSessionCompanyId(): Promise<string> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized: No company ID found in session');
  }
  
  return session.user.companyId;
}

export async function requireManagerOrAdmin(): Promise<void> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Unauthorized: No session found');
  }
  
  if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
    throw new Error('Forbidden: Manager or Admin access required');
  }
}
