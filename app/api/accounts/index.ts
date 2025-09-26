// API route to get all accounts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const accounts = await prisma.account.findMany({
        select: { id: true, name: true }
      });
      res.status(200).json({ accounts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
