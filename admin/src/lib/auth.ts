import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { APIContext } from "astro";

export const ADMIN_ROLE = "admin";
export const WORKER_ROLE = "worker";

export type StaffRole = "admin" | "worker";

export interface AdminUser {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
}

const PUBLIC_PREFIXES = ["/api/auth", "/_image", "/favicon.svg", "/favicon.ico"];

export function isPublicPath(pathname: string): boolean {
    if (pathname === "/login") {
        return true;
    }
    return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

export function createSupabaseServerClient(context: Pick<APIContext, "cookies" | "request">) {
    return createServerClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return parseCookieHeader(
                        context.request.headers.get("Cookie") ?? "",
                    );
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        context.cookies.set(name, value, options);
                    });
                },
            },
        },
    );
}

export function hasAdminSession(locals: App.Locals): boolean {
    return !!locals.user && locals.user.role === ADMIN_ROLE;
}

export function hasStaffSession(locals: App.Locals): boolean {
    return (
        !!locals.user &&
        (locals.user.role === ADMIN_ROLE || locals.user.role === WORKER_ROLE)
    );
}

export async function resolveStaffRole(
    supabase: ReturnType<typeof createSupabaseServerClient>,
    userId: string,
    fallbackRole: unknown,
): Promise<string | null> {
    const { data: staffRow } = await supabase
        .from("staff")
        .select("role, active")
        .eq("id", userId)
        .maybeSingle();

    if (staffRow) {
        return staffRow.active ? staffRow.role : null;
    }

    return typeof fallbackRole === "string" ? fallbackRole : null;
}