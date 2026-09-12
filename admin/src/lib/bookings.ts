import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Car } from "@/types/car";
import type { Booking } from "@/types/booking";

export interface BookingListItem extends Booking {
    cars: Pick<Car, "make" | "model" | "plate_number"> | null;
}

export interface BookingExtras {
    id: string;
    code: string;
    name: string;
    price: number;
    pricing: "per_day" | "per_booking";
}

export interface BookingDetail extends Booking {
    car: Car | null;
    extras: BookingExtras[];
}

export async function getBookings(
    opts: { page?: number; pageSize?: number } = {},
): Promise<{ data: BookingListItem[]; count: number }> {
    const page = Math.max(1, Math.floor(opts.page ?? 1));
    const pageSize = Math.max(1, Math.floor(opts.pageSize ?? 10));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabaseAdmin
        .from("bookings")
        .select("*, cars(make, model, plate_number)", { count: "exact" })
        .order("pickup_at", { ascending: false })
        .range(from, to);

    if (error) {
        throw new Error(`Error al obtener las reservas: ${error.message}`);
    }

    return { data: (data ?? []) as BookingListItem[], count: count ?? 0 };
}

export async function getBookingById(id: string): Promise<BookingDetail | null> {
    const { data, error } = await supabaseAdmin
        .from("bookings")
        .select("*, cars(*)")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw new Error(`Error al obtener la reserva: ${error.message}`);
    }
    if (!data) {
        return null;
    }

    const { data: extrasData, error: extrasError } = await supabaseAdmin
        .from("booking_extras")
        .select("extras(id, code, name, price, pricing)")
        .eq("booking_id", id);

    if (extrasError) {
        throw new Error(`Error al obtener los extras: ${extrasError.message}`);
    }

    const { cars, ...booking } = data;

    return {
        ...(booking as Booking),
        car: (cars as Car) ?? null,
        extras: (extrasData ?? []).map((row) => row.extras) as BookingExtras[],
    };
}

export interface DailySummary {
    date: string;
    salidas: BookingListItem[];
    entradas: BookingListItem[];
}

const APP_TIME_ZONE = "Europe/Madrid";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

export function toDateKey(dateOrIso: string | Date): string {
    const d = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
    return dateKeyFormatter.format(d);
}

function madridOffsetMs(dateStr: string): number {
    const probe = new Date(`${dateStr}T00:00:00.000Z`);
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: APP_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(probe);
    const map: Record<string, number> = {};
    for (const p of parts) {
        if (p.type !== "literal") map[p.type] = Number(p.value);
    }
    const wallClockAsUtc = Date.UTC(
        map.year,
        map.month - 1,
        map.day,
        map.hour,
        map.minute,
        map.second,
    );
    return wallClockAsUtc - probe.getTime();
}

function madridDayStartUtc(dateStr: string): number {
    const [y, m, d] = dateStr.split("-").map(Number);
    return Date.UTC(y, m - 1, d, 0, 0, 0) - madridOffsetMs(dateStr);
}

function nextDateStr(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    return toDateKey(new Date(Date.UTC(y, m - 1, d + 1, 12)));
}

export async function getDailySummary(dateStr: string): Promise<DailySummary> {
    const startISO = new Date(madridDayStartUtc(dateStr)).toISOString();
    const endISO = new Date(
        madridDayStartUtc(nextDateStr(dateStr)),
    ).toISOString();

    const { data, error } = await supabaseAdmin
        .from("bookings")
        .select("*, cars(make, model, plate_number)")
        .not("confirmed_at", "is", null)
        .is("cancelled_at", null)
        .or(
            `and(pickup_at.gte.${startISO},pickup_at.lt.${endISO}),and(dropoff_at.gte.${startISO},dropoff_at.lt.${endISO})`,
        )
        .order("pickup_at", { ascending: true });

    if (error) {
        throw new Error(
            `Error al obtener el resumen diario: ${error.message}`,
        );
    }

    const rows = (data ?? []) as BookingListItem[];
    const key = dateStr;

    const salidas = rows.filter((b) => toDateKey(b.pickup_at) === key);
    const entradas = rows.filter((b) => toDateKey(b.dropoff_at) === key);

    return { date: dateStr, salidas, entradas };
}

export async function getBookingsInRange(
    start: string,
    end: string,
): Promise<Booking[]> {
    const { data, error } = await supabaseAdmin
        .from("bookings")
        .select(
            "id, car_id, pickup_at, dropoff_at, cancelled_at, confirmed_at, guest_name",
        )
        .is("cancelled_at", null)
        .lte("pickup_at", end)
        .gte("dropoff_at", start);

    if (error) {
        throw new Error(`Error al obtener las reservas: ${error.message}`);
    }

    return (data ?? []) as Booking[];
}

export function bookingStatus(booking: {
    cancelled_at: string | null;
    confirmed_at: string | null;
    dropoff_at: string;
}): { label: string; classes: string } {
    if (booking.cancelled_at) {
        return { label: "Cancelada", classes: "badge-error" };
    }
    if (!booking.confirmed_at) {
        return { label: "Pendiente", classes: "badge-warning" };
    }
    if (new Date(booking.dropoff_at).getTime() < Date.now()) {
        return { label: "Completada", classes: "badge-ghost" };
    }
    return { label: "Confirmada", classes: "badge-success" };
}

export async function confirmBooking(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from("bookings")
        .update({ confirmed_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        throw new Error(`Error al confirmar la reserva: ${error.message}`);
    }
}

export async function cancelBooking(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from("bookings")
        .update({ cancelled_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        throw new Error(`Error al cancelar la reserva: ${error.message}`);
    }
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
