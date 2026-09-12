/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
    namespace App {
        interface Locals {
            supabase: import("@supabase/supabase-js").SupabaseClient;
            user: {
                id: string;
                email: string | null;
                name: string | null;
                role: string;
            } | null;
        }
    }
}

export {};