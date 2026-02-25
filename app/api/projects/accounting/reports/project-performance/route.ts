import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Helper to get month label
function getMonthLabel(date: Date) {
  return date.toLocaleString('default', { month: 'short', year: '2-digit' });
}

export async function GET() {
  try {
    // Auth check skipped for now (add back if getServerSession is available)

    // Get projects grouped by month for started and completed
    const startedProjects = await prisma.project.findMany({
      where: {},
      select: { id: true, createdAt: true },
    });
    const completedProjects = await prisma.project.findMany({
      where: { status: 'Completed' },
      select: { id: true, actualCompletionDate: true },
    });

    // Aggregate by month
    const monthMap: Record<string, { started: number; completed: number }> = {};
    startedProjects.forEach((p: { id: string; createdAt: Date }) => {
      if (p.createdAt) {
        const label = getMonthLabel(p.createdAt);
        if (!monthMap[label]) monthMap[label] = { started: 0, completed: 0 };
        monthMap[label].started++;
      }
    });
    completedProjects.forEach((p: { id: string; actualCompletionDate: Date | null }) => {
      if (p.actualCompletionDate) {
        const label = getMonthLabel(p.actualCompletionDate);
        if (!monthMap[label]) monthMap[label] = { started: 0, completed: 0 };
        monthMap[label].completed++;
      }
    });

    // Sort by month (descending)
    const performance = Object.entries(monthMap)
      .map(([month, { started, completed }]) => ({ month, started, completed }))
      .sort((a, b) => {
        // Parse year and month for sorting
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const aIdx = parseInt('20'+aYear)*12 + months.indexOf(aMonth);
        const bIdx = parseInt('20'+bYear)*12 + months.indexOf(bMonth);
        return aIdx - bIdx;
      });

    return NextResponse.json({ performance });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch project performance', details: error?.message || String(error) }, { status: 500 });
  }
}
