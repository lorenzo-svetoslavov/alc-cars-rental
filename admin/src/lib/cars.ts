import { supabase } from "@/lib/supabase";
import type { Car } from "@/types/car";

export type CarUpdate = Partial<
    Omit<Car, "id" | "created_at" | "updated_at">
>;

export async function getCarById(id: string): Promise<Car | null> {
    const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw new Error(`Error al obtener el coche: ${error.message}`);
    }

    return (data as Car) ?? null;
}

export async function updateCar(id: string, updates: CarUpdate): Promise<void> {
    const { error } = await supabase
        .from("cars")
        .update(updates)
        .eq("id", id);

    if (error) {
        throw new Error(`Error al actualizar el coche: ${error.message}`);
    }
}

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