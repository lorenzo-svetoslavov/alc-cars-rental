import type { APIRoute } from "astro";
import {
    ADMIN_ROLE,
    WORKER_ROLE,
    createSupabaseServerClient,
    resolveStaffRole,
} from "@/lib/auth";

export const POST: APIRoute = async (context) => {
    const { request, redirect } = context;
    const formData = await request.formData();
    const email = (formData.get("email") ?? "").toString().trim();
    const password = (formData.get("password") ?? "").toString();

    if (!email || !password) {
        return redirect("/login?error=invalid");
    }

    const supabase = createSupabaseServerClient(context);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error || !data.session) {
        return redirect("/login?error=invalid");
    }

    const role = await resolveStaffRole(
        supabase,
        data.user.id,
        data.user.app_metadata?.role,
    );

    if (role !== ADMIN_ROLE && role !== WORKER_ROLE) {
        await supabase.auth.signOut();
        return redirect("/login?error=forbidden");
    }

    return redirect("/");
};