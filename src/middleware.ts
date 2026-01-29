import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isAuthPage = req.nextUrl.pathname.startsWith("/login");

        if (isAuthPage) {
            if (isAuth) {
                return NextResponse.redirect(new URL("/products", req.url));
            }
            return null;
        }

        if (!isAuth) {
            let from = req.nextUrl.pathname;
            if (req.nextUrl.search) {
                from += req.nextUrl.search;
            }
            return NextResponse.redirect(
                new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.url)
            );
        }

        // Role-based protection
        if (req.nextUrl.pathname.startsWith("/admin") && token?.role !== "Super Admin" && token?.role !== "admin") {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/login',
        }
    }
);

export const config = {
    matcher: ["/products/:path*", "/orders/:path*"],
};
