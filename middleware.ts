import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;
        const role = token?.role as string | undefined;
        const planType = token?.planType as string | undefined;

        // --- 1. Module-Level Access Control based on planType ---

        // If user is SHOPS_ONLY, block access to projects and manufacturing
        if (planType === 'SHOPS_ONLY') {
            if (path.startsWith('/dashboard') || path.startsWith('/projects') || path.startsWith('/manufacturing')) {
                return NextResponse.redirect(new URL('/shop/dashboard', req.url));
            }
        }

        // If user is PROJECTS_ONLY, block access to shop and manufacturing
        if (planType === 'PROJECTS_ONLY') {
            if (path.startsWith('/shop') || path.startsWith('/manufacturing')) {
                // If they try to access shop/manufacturing, send them to main dashboard
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }
        }

        // If user is MANUFACTURING_ONLY, block access to shop and projects
        if (planType === 'MANUFACTURING_ONLY') {
            if (path.startsWith('/shop') || path.startsWith('/dashboard') || path.startsWith('/projects')) {
                return NextResponse.redirect(new URL('/manufacturing/dashboard', req.url));
            }
        }

        // --- 2. Role-Based Access Control (RBAC) within modules ---

        // Shop Reports: Only ADMIN and MANAGER
        if (path.startsWith('/shop/reports') && role !== 'ADMIN' && role !== 'MANAGER') {
            return NextResponse.redirect(new URL('/shop/dashboard?error=Unauthorized', req.url));
        }

        // Shop Settings: Only ADMIN
        if (path.startsWith('/shop/settings') && role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/shop/dashboard?error=Unauthorized', req.url));
        }

        // Project Reports: Only ADMIN and MANAGER
        if (path.startsWith('/projects/reports') && role !== 'ADMIN' && role !== 'MANAGER') {
            return NextResponse.redirect(new URL('/dashboard?error=Unauthorized', req.url));
        }

        // Manufacturing Reports: Only ADMIN and MANAGER
        if (path.startsWith('/manufacturing/reports') && role !== 'ADMIN' && role !== 'MANAGER') {
            return NextResponse.redirect(new URL('/manufacturing/dashboard?error=Unauthorized', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    // Wadooyinka la ilaalinayo (Private Routes) - Expanded matcher to cover all core modules
    matcher: [
        "/dashboard/:path*",
        "/shop/:path*",
        "/projects/:path*",
        "/manufacturing/:path*"
    ],
};
