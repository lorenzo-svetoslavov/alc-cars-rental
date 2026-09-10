import { supabase } from "@/lib/supabase";
import type { Car } from "@/types/car";
import type { Booking } from "@/types/booking";

export async function getBookingsInRange(
    start: string,
    end: string,
): Promise<Booking[]> {
    const { data, error } = await supabase
        .from("bookings")
        .select(
            "id, car_id, pickup_at, dropoff_at, cancelled_at, guest_name",
        )
        .is("cancelled_at", null)
        .lte("pickup_at", end)
        .gte("dropoff_at", start);

    if (error) {
        throw new Error(`Error al obtener las reservas: ${error.message}`);
    }

    return (data ?? []) as Booking[];
}

function toDateKey(dateOrIso: string | Date): string {
    const d = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function addDays(start: Date, days: number): string {
    const d = new Date(start);
    d.setDate(d.getDate() + days);
    return toDateKey(d);
}

export interface AgendaDayInfo {
    dateKey: string;
    isPickup: boolean;
    isDropoff: boolean;
    booking: Booking;
    lane: number;
}

export interface AgendaRow {
    car: Car;
    bookedDays: Map<string, AgendaDayInfo[]>;
    totalLanes: number;
}

function assignLanes(
    bookings: Booking[],
    startKey: string,
    endKey: string,
): Map<string, AgendaDayInfo[]> {
    const sorted = [...bookings].sort(
        (a, b) =>
            new Date(a.pickup_at).getTime() -
            new Date(b.pickup_at).getTime(),
    );

    const lanes: Booking[][] = [];
    const bookingLane = new Map<Booking, number>();

    for (const booking of sorted) {
        let assigned = false;
        for (let i = 0; i < lanes.length; i++) {
            const conflict = lanes[i].some((existing) => {
                const eStart = toDateKey(existing.pickup_at);
                const eEnd = toDateKey(existing.dropoff_at);
                const bStart = toDateKey(booking.pickup_at);
                const bEnd = toDateKey(booking.dropoff_at);
                return bStart <= eEnd && bEnd >= eStart;
            });
            if (!conflict) {
                lanes[i].push(booking);
                bookingLane.set(booking, i);
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            lanes.push([booking]);
            bookingLane.set(booking, lanes.length - 1);
        }
    }

    const result = new Map<string, AgendaDayInfo[]>();
    for (const booking of sorted) {
        const lane = bookingLane.get(booking)!;
        const pickup = toDateKey(booking.pickup_at);
        const dropoff = toDateKey(booking.dropoff_at);
        const start = pickup < startKey ? startKey : pickup;
        const end = dropoff > endKey ? endKey : dropoff;
        const cursor = new Date(start + "T00:00:00");
        const last = new Date(end + "T00:00:00");
        while (cursor <= last) {
            const key = toDateKey(cursor);
            const isPickup = key === pickup;
            const isDropoff = key === dropoff;
            const existing = result.get(key) ?? [];
            existing.push({
                dateKey: key,
                isPickup,
                isDropoff,
                booking,
                lane,
            });
            result.set(key, existing);
            cursor.setDate(cursor.getDate() + 1);
        }
    }

    return result;
}

export async function getAgendaRows(
    month: Date,
    cars: Car[],
): Promise<AgendaRow[]> {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const firstDay = new Date(monthStart);
    const firstWeekday = firstDay.getDay();
    firstDay.setDate(firstDay.getDate() - firstWeekday);

    const startKey = toDateKey(firstDay);
    const endKey = addDays(firstDay, 41);

    const bookings = await getBookingsInRange(startKey, endKey);

    const rows: AgendaRow[] = [];
    for (const car of cars) {
        const carBookings = bookings.filter((b) => b.car_id === car.id);

        if (car.deleted_at && carBookings.length === 0) {
            continue;
        }

        const bookedDays = assignLanes(carBookings, startKey, endKey);

        let totalLanes = 0;
        for (const dayInfos of bookedDays.values()) {
            for (const info of dayInfos) {
                if (info.lane + 1 > totalLanes) {
                    totalLanes = info.lane + 1;
                }
            }
        }

        rows.push({ car, bookedDays, totalLanes });
    }

    return rows;
}
