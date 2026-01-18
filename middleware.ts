import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // Halkan waxaan ku samayn karnaa role-based authorization haddii loo baahdo
        // Tusaale ahaan, haddii user-ku rabo inuu galo /shop laakiin aanu ahayn SHOP owner
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token, // Kaliya ogolaaw haddii user-ku login yahay
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
