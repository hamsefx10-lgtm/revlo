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
        if (path.startsWith('/shop/reports') && role !== 'ADMIN' && role !== 'MANAGER' && role !== 'SHOP_ADMIN') {
            return NextResponse.redirect(new URL('/shop/dashboard?error=Unauthorized', req.url));
        }

        // Shop Settings: Only ADMIN
        if (path.startsWith('/shop/settings') && role !== 'ADMIN' && role !== 'SHOP_ADMIN') {
            return NextResponse.redirect(new URL('/shop/dashboard?error=Unauthorized', req.url));
        }

        // Project Reports: Only ADMIN and MANAGER
        if (path.startsWith('/projects/reports') && role !== 'ADMIN' && role !== 'MANAGER' && role !== 'PROJECTS_ADMIN') {
            return NextResponse.redirect(new URL('/dashboard?error=Unauthorized', req.url));
        }

        // Manufacturing Reports: Only ADMIN and MANAGER
        if (path.startsWith('/manufacturing/reports') && role !== 'ADMIN' && role !== 'MANAGER' && role !== 'MANUFACTURING_ADMIN') {
            return NextResponse.redirect(new URL('/manufacturing/dashboard?error=Unauthorized', req.url));
        }

        // --- 3. Module-Scoped Admin Protection (Strict Shell Isolation) ---
        const rolePermissions: Record<string, { allowedPrefixes: string[], home: string }> = {
            PROJECTS_ADMIN: {
                allowedPrefixes: ['/projects', '/workshop', '/dashboard', '/reports'],
                home: '/dashboard'
            },
            SHOP_ADMIN: {
                allowedPrefixes: ['/shop', '/reports'],
                home: '/shop/dashboard'
            },
            MANUFACTURING_ADMIN: {
                allowedPrefixes: ['/manufacturing', '/reports'],
                home: '/manufacturing/dashboard'
            },
            MEMBER: {
                allowedPrefixes: ['/dashboard', '/shop', '/projects'],
                home: '/dashboard'
            }
        };

        const permissions = rolePermissions[role ?? ''];
        if (permissions) {
            const isPathAllowed = permissions.allowedPrefixes.some(prefix => path.startsWith(prefix));
            
            // If the path is NOT in the allowed list for this role, redirect to their home
            if (!isPathAllowed) {
                return NextResponse.redirect(new URL(permissions.home, req.url));
            }

            // Prevent cross-module access for specific admin roles
            if (role === 'SHOP_ADMIN' && (path.startsWith('/projects') || path.startsWith('/manufacturing'))) {
                return NextResponse.redirect(new URL('/shop/dashboard', req.url));
            }
            if (role === 'PROJECTS_ADMIN' && (path.startsWith('/shop') || path.startsWith('/manufacturing'))) {
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }
        }

        // --- 4. Admin-Only Protection (Strictly SUPER_ADMIN) ---
        if (path.startsWith('/admin')) {
            if (role !== 'SUPER_ADMIN') {
               return NextResponse.redirect(new URL('/dashboard?error=Unauthorized', req.url));
            }
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
        "/manufacturing/:path*",
        "/admin",
        "/admin/:path*"
    ],
};
