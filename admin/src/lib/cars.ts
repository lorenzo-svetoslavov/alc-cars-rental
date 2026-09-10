import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Car } from "@/types/car";

export type CarCreate = Omit<Car, "id" | "created_at" | "updated_at" | "deleted_at">;

export type CarUpdate = Partial<CarCreate>;

export async function getCarById(id: string): Promise<Car | null> {
    const { data, error } = await supabase
        .from("cars")
        .select("*")
        .is("deleted_at", null)
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw new Error(`Error al obtener el coche: ${error.message}`);
    }

    return (data as Car) ?? null;
}

export async function updateCar(id: string, updates: CarUpdate): Promise<void> {
    const { error } = await supabaseAdmin
        .from("cars")
        .update(updates)
        .eq("id", id);

    if (error) {
        throw new Error(`Error al actualizar el coche: ${error.message}`);
    }
}

export async function createCar(data: CarCreate): Promise<Car> {
    const { data: car, error } = await supabaseAdmin
        .from("cars")
        .insert(data)
        .select()
        .single();

    if (error) {
        throw new Error(`Error al crear el coche: ${error.message}`);
    }

    return car as Car;
}

export async function deleteCar(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from("cars")
        .update({ deleted_at: new Date().toISOString(), available: false })
        .eq("id", id);

    if (error) {
        throw new Error(`Error al eliminar el coche: ${error.message}`);
    }
}

export async function getCars(): Promise<Car[]> {
    const { data, error } = await supabase
        .from("cars")
        .select("*")
        .is("deleted_at", null)
        .order("make", { ascending: true })
        .order("model", { ascending: true });

    if (error) {
        throw new Error(`Error al obtener los coches: ${error.message}`);
    }

    return (data ?? []) as Car[];
}

export async function getAllCars(): Promise<Car[]> {
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