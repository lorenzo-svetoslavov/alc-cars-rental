import { defineMiddleware } from "astro:middleware";
import {
    ADMIN_ROLE,
    WORKER_ROLE,
    createSupabaseServerClient,
    isPublicPath,
    resolveStaffRole,
} from "@/lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
    const supabase = createSupabaseServerClient(context);
    context.locals.supabase = supabase;

    let staffUser: App.Locals["user"] = null;

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
        const session = sessionData.session;
        const claimsRole = session.user.app_metadata?.role;
        const role = await resolveStaffRole(supabase, session.user.id, claimsRole);

        if (role === ADMIN_ROLE || role === WORKER_ROLE) {
            const metadataName =
                session.user.user_metadata?.name ??
                session.user.user_metadata?.full_name ??
                null;
            staffUser = {
                id: session.user.id,
                email: session.user.email ?? null,
                name: typeof metadataName === "string" ? metadataName : null,
                role,
            };
        }
    }

    context.locals.user = staffUser;

    if (isPublicPath(context.url.pathname)) {
        return next();
    }

    if (!staffUser) {
        return context.redirect("/login");
    }

    return next();
});