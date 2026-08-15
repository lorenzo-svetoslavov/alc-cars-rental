import { supabase } from "@/lib/supabase";
import type { Car } from "@/types/car";

export async function getCars() {
    let query = supabase
        .from("cars")
        .select("*");

    const { data, error } = await query;
    if (error) throw new Error(`Error al obtener los coches: ${error.message}`);

    return (data ?? []) as Car[];
}