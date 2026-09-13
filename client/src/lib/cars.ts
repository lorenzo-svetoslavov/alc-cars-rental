import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { type Car, type CarSummary } from "@/types/car";

// ---------------------------------------------------------------------------
// 1. Filters coming from the URL (?pickup=2026-08-16 10:30&return=...)
// ---------------------------------------------------------------------------

/** Date & time as flatpickr writes it, e.g. "2026-08-16 10:30" */
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

/** Invalid date text is ignored */
function dateFilter() {
    return z.string().regex(DATE_TIME_PATTERN).optional().catch(undefined);
}

const carFiltersSchema = z.object({
    pickupAt: dateFilter(),
    returnAt: dateFilter(),
});

/** Filters ya validados: todos los campos son opcionales */
export type CarFilters = {
    pickupAt?: string;
    returnAt?: string;
};

/** Reads and validates the filters of the fleet page query string */
export function parseCarFilters(params: URLSearchParams): CarFilters {
    return carFiltersSchema.parse({
        pickupAt: params.get("pickup"),
        returnAt: params.get("return"),
    }) as CarFilters;
}

// ---------------------------------------------------------------------------
// 2. Supabase queries
// ---------------------------------------------------------------------------

/**
 * Postgres expects "2026-08-16T10:30", flatpickr writes it with a space.
 *
 * Se manda la hora de pared tal cual, sin zona: `search_cars` la interpreta en
 * Europe/Madrid. Añadir aquí un offset fijo rompería con el horario de verano.
 */
function toTimestamp(dateTime: string) {
    return dateTime.replace(" ", "T");
}

/**
 * Cars shown in the catalogue, narrowed down by the selected dates.
 *
 * Everything (availability and order) is resolved by the `search_cars`
 * function in Postgres: one single round-trip, and the overlap check stays in
 * the database instead of travelling as a list of ids inside the query string.
 */
export async function getCars(filters: CarFilters = {}): Promise<CarSummary[]> {
    // Dates only filter when both are selected: a single date can't define a range
    const { pickupAt, returnAt } = filters;
    const dateRange = pickupAt && returnAt ? { pickupAt, returnAt } : null;

    const { data, error } = await supabase.rpc("search_cars", {
        p_pickup: dateRange ? toTimestamp(dateRange.pickupAt) : null,
        p_dropoff: dateRange ? toTimestamp(dateRange.returnAt) : null,
    });

    if (error) {
        throw new Error(`Error al obtener los coches: ${error.message}`);
    }

    return (data ?? []) as CarSummary[];
}
