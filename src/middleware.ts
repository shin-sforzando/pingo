import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Define protected routes that require authentication
const protectedRoutes = ["/game/create", "/game/join", "/profile", "/settings"];

// Define auth routes that should redirect to home if already authenticated
const authRoutes = ["/login", "/register"];

/**
 * Middleware to handle authentication and route protection
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Get authentication status from cookies
  const authCookie = request.cookies.get("auth");
  const isAuthenticated = !!authCookie?.value;

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // Redirect to home if accessing auth routes while already authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Continue with the request for all other cases
  return NextResponse.next();
}

/**
 * Configure which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api routes (API endpoints)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
};
