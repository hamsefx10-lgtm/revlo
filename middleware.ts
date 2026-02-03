import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;
        const role = token?.role as string | undefined;

        // Role-Based Access Control (RBAC)

        // 1. Reports: Only ADMIN and MANAGER
        if (path.startsWith('/shop/reports') && role !== 'ADMIN' && role !== 'MANAGER') {
            return NextResponse.redirect(new URL('/shop/dashboard?error=Unauthorized', req.url));
        }

        // 2. Settings: Only ADMIN
        if (path.startsWith('/shop/settings') && role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/shop/dashboard?error=Unauthorized', req.url));
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
    // Wadooyinka la ilaalinayo (Private Routes)
    matcher: [
        "/dashboard/:path*",
        "/shop/dashboard/:path*",
        // Ku dar wadooyin kale halkan haddii loo baahdo
    ],
};
