import { supabase } from "@/lib/supabase";
import type { Car } from "@/types/car";

export async function getCars(): Promise<Car[]> {
    const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("make", { ascending: true })
        .order("model", { ascending: true });

    if (error) {
        throw new Error(`Error al obtener los coches: ${error.message}`);
    }

    return (data ?? []) as Car[];
}