import { z } from "zod";

import { supabase } from "@/lib/supabase";
import {
    carOptionValues,
    type Car,
    type CarOptionGroup,
    type CarSummary,
} from "@/types/car";

// ---------------------------------------------------------------------------
// 1. Filters coming from the URL (?category=suv&maxPrice=80&pickup=...)
// ---------------------------------------------------------------------------

/** Date & time as flatpickr writes it, e.g. "2026-08-16 10:30" */
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

/**
 * Filter for a <select>: only accepts the values of its group
 * ("suv", "manual"…). Anything else (empty value, typo in the URL) becomes
 * `undefined` thanks to .catch(), so the filter is simply ignored instead of
 * throwing and breaking the page.
 */
function selectFilter(group: CarOptionGroup) {
    return z.enum(carOptionValues(group)).optional().catch(undefined);
}

/** Same idea for a date field: invalid text is ignored */
function dateFilter() {
    return z.string().regex(DATE_TIME_PATTERN).optional().catch(undefined);
}

const carFiltersSchema = z.object({
    category: selectFilter("category"),
    transmission: selectFilter("transmission"),
    fuel: selectFilter("fuel"),
    maxPrice: z.coerce.number().positive().optional().catch(undefined),
    pickupAt: dateFilter(),
    returnAt: dateFilter(),
});

/** Filters ya validados: todos los campos son opcionales */
export type CarFilters = {
    category?: Car["category"];
    transmission?: Car["transmission"];
    fuel?: Car["fuel"];
    maxPrice?: number;
    pickupAt?: string;
    returnAt?: string;
};

/** Reads and validates the filters of the fleet page query string */
export function parseCarFilters(params: URLSearchParams): CarFilters {
    // El parse valida contra los mismos valores de CarOptionGroup (category,
    // transmission, fuel), así que el resultado siempre encaja con CarFilters.
    return carFiltersSchema.parse({
        category: params.get("category"),
        transmission: params.get("transmission"),
        fuel: params.get("fuel"),
        maxPrice: params.get("maxPrice"),
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
 * Cars shown in the catalogue, narrowed down by the selected filters.
 *
 * Everything (filters, availability and order) is resolved by the `search_cars`
 * function in Postgres: one single round-trip, and the overlap check stays in
 * the database instead of travelling as a list of ids inside the query string.
 */
export async function getCars(filters: CarFilters = {}): Promise<CarSummary[]> {
    // Dates only filter when both are selected: a single date can't define a range
    const { pickupAt, returnAt } = filters;
    const dateRange = pickupAt && returnAt ? { pickupAt, returnAt } : null;

    const { data, error } = await supabase.rpc("search_cars", {
        p_category: filters.category ?? null,
        p_transmission: filters.transmission ?? null,
        p_fuel: filters.fuel ?? null,
        p_max_price: filters.maxPrice ?? null,
        p_pickup: dateRange ? toTimestamp(dateRange.pickupAt) : null,
        p_dropoff: dateRange ? toTimestamp(dateRange.returnAt) : null,
    });

    if (error) {
        throw new Error(`Error al obtener los coches: ${error.message}`);
    }

    return (data ?? []) as CarSummary[];
}
