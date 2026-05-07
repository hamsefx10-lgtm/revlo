import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                phone: true,
                createdAt: true,
                lastLogin: true,
                lastDevice: true,
                lastLocation: true,
                lastActiveAt: true,
                companyId: true,
                TwoFAEnabled: true,
                company: {
                    select: {
                        id: true, name: true, industry: true, planType: true,
                        logoUrl: true, email: true, phone: true, address: true,
                        website: true, taxId: true, taxRate: true,
                        fiscalYearStartMonth: true, createdAt: true,
                    }
                }
            }
        });

        if (!user || !user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const companyId = user.companyId;

        // ── Login Activity (last 10 logins from AuditLog) ──
        const loginLogs = await prisma.auditLog.findMany({
            where: {
                userId: session.user.id,
                action: { in: ['LOGIN', 'LOGOUT', 'LOGIN_SUCCESS', 'login', 'logout'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                action: true,
                ipAddress: true,
                userAgent: true,
                details: true,
                createdAt: true,
            }
        });

        // ── Active Sessions (Trusted Devices) ──
        const trustedDevices = await prisma.trustedDevice.findMany({
            where: { userId: session.user.id },
            orderBy: { lastUsed: 'desc' },
            select: {
                id: true,
                userAgent: true,
                lastUsed: true,
                createdAt: true,
                token: true,
            }
        });

        // ── Personalization Settings ──
        let prefs = await prisma.personalizationSettings.findFirst({
            where: { companyId }
        });
        if (!prefs) {
            prefs = await prisma.personalizationSettings.create({
                data: {
                    companyId,
                    theme: 'system',
                    language: 'so',
                    avatarColor: '#3498DB',
                }
            });
        }

        // ── Company Age ──
        const now = new Date();
        const companyCreated = user.company?.createdAt || user.createdAt;
        const ageDays = Math.floor((now.getTime() - new Date(companyCreated).getTime()) / (1000 * 60 * 60 * 24));
        const ageMonths = Math.floor(ageDays / 30);
        const ageYears = Math.floor(ageDays / 365);

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.fullName,
                email: user.email,
                phone: user.phone || '',
                role: user.role,
                status: user.status,
                joinedAt: user.createdAt,
                lastLogin: user.lastLogin,
                lastDevice: user.lastDevice,
                lastLocation: user.lastLocation,
                twoFAEnabled: user.TwoFAEnabled,
            },
            company: {
                ...user.company,
                age: ageYears > 0 ? `${ageYears} sano` : ageMonths > 0 ? `${ageMonths} bilood` : `${ageDays} maalmood`,
                ageDays,
            },
            loginActivity: loginLogs.map(l => ({
                id: l.id,
                action: l.action,
                ip: l.ipAddress || '—',
                device: parseDevice(l.userAgent),
                details: l.details,
                date: l.createdAt,
            })),
            sessions: trustedDevices.map(d => ({
                id: d.id,
                device: parseDevice(d.userAgent),
                raw: d.userAgent?.slice(0, 80),
                lastUsed: d.lastUsed,
                createdAt: d.createdAt,
                isCurrent: d.token === (session.user as any)?.sessionToken,
            })),
            preferences: {
                theme: prefs.theme,
                language: prefs.language,
                avatarColor: prefs.avatarColor,
                notifications: prefs.notifications,
            },
        });
    } catch (error: any) {
        console.error('Profile API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Parse user agent to friendly device name
function parseDevice(ua?: string | null): string {
    if (!ua) return 'Qalabka Lama Yaqaan';
    const lower = ua.toLowerCase();
    let browser = 'Browser';
    if (lower.includes('chrome') && !lower.includes('edg')) browser = 'Chrome';
    else if (lower.includes('firefox')) browser = 'Firefox';
    else if (lower.includes('safari') && !lower.includes('chrome')) browser = 'Safari';
    else if (lower.includes('edg')) browser = 'Edge';

    let os = '';
    if (lower.includes('windows')) os = 'Windows';
    else if (lower.includes('mac')) os = 'macOS';
    else if (lower.includes('linux')) os = 'Linux';
    else if (lower.includes('android')) os = 'Android';
    else if (lower.includes('iphone') || lower.includes('ipad')) os = 'iOS';

    return os ? `${browser} · ${os}` : browser;
}

// PUT — Update preferences (theme, language) AND user profile (fullName, email, phone)
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });
        if (!dbUser?.companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

        const body = await req.json();
        const { theme, language, avatarColor, fullName, email, phone } = body;

        // --- Update user profile fields ---
        const userUpdate: any = {};
        if (fullName !== undefined) userUpdate.fullName = fullName;
        if (email !== undefined) userUpdate.email = email;
        if (phone !== undefined) userUpdate.phone = phone;

        if (Object.keys(userUpdate).length > 0) {
            // Validate email uniqueness if changing
            if (email) {
                const existingEmail = await prisma.user.findFirst({
                    where: { email, id: { not: session.user.id } }
                });
                if (existingEmail) {
                    return NextResponse.json({ error: 'Email-kan qof kale ayaa isticmaalaya' }, { status: 400 });
                }
            }
            await prisma.user.update({
                where: { id: session.user.id },
                data: userUpdate
            });
        }

        // --- Update preferences ---
        const prefUpdate: any = {};
        if (theme) prefUpdate.theme = theme;
        if (language) prefUpdate.language = language;
        if (avatarColor) prefUpdate.avatarColor = avatarColor;

        let prefs = null;
        if (Object.keys(prefUpdate).length > 0) {
            prefs = await prisma.personalizationSettings.upsert({
                where: { companyId: dbUser.companyId },
                update: prefUpdate,
                create: { companyId: dbUser.companyId, ...prefUpdate },
            });
        }

        return NextResponse.json({ success: true, preferences: prefs, userUpdated: Object.keys(userUpdate) });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Remove a trusted device/session
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { deviceId } = await req.json();
        if (!deviceId) return NextResponse.json({ error: 'Device ID required' }, { status: 400 });

        await prisma.trustedDevice.deleteMany({
            where: { id: deviceId, userId: session.user.id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
