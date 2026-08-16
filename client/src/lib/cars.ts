import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { carOptionValues, type Car, type CarOptionGroup } from "@/types/car";

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
 * Ids of the cars already booked during the requested dates.
 *
 * Two date ranges overlap when each one starts before the other one ends,
 * so a booking blocks the car if it starts before our return and ends after
 * our pickup. Cancelled bookings don't count.
 */
async function getBookedCarIds(pickupAt: string, returnAt: string): Promise<string[]> {
    // Postgres expects "2026-08-16T10:30", flatpickr uses a space
    const pickup = pickupAt.replace(" ", "T");
    const dropoff = returnAt.replace(" ", "T");

    const { data, error } = await supabase
        .from("bookings")
        .select("car_id")
        .is("cancelled_at", null)
        .lt("pickup_at", dropoff)
        .gt("dropoff_at", pickup);

    if (error) {
        throw new Error(`Error al obtener las reservas: ${error.message}`);
    }

    return (data ?? []).map((booking) => booking.car_id as string);
}

/** Cars shown in the catalogue, narrowed down by the selected filters */
export async function getCars(filters: CarFilters = {}): Promise<Car[]> {
    let query = supabase
        .from("cars")
        .select("*")
        .order("available", { ascending: false })
        .order("daily_rate", { ascending: true });

    if (filters.category) {
        query = query.eq("category", filters.category);
    }

    if (filters.transmission) {
        query = query.eq("transmission", filters.transmission);
    }

    if (filters.fuel) {
        query = query.eq("fuel", filters.fuel);
    }

    if (filters.maxPrice) {
        query = query.lte("daily_rate", filters.maxPrice);
    }

    // Dates only filter when both are selected: a single date can't define a range
    if (filters.pickupAt && filters.returnAt) {
        const bookedCarIds = await getBookedCarIds(filters.pickupAt, filters.returnAt);

        if (bookedCarIds.length > 0) {
            // PostgREST syntax for "id NOT IN (a,b,c)"
            query = query.not("id", "in", `(${bookedCarIds.join(",")})`);
        }
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Error al obtener los coches: ${error.message}`);
    }

    return (data ?? []) as Car[];
}
