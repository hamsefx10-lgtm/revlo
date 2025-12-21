import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// TypeScript workaround: NextAuth v4 default export type issue in build environment
// This is a known compatibility issue between NextAuth v4 and TypeScript strict mode
const handler = (NextAuth as any)(authOptions);

export { handler as GET, handler as POST };