export interface Booking {
    id: string;
    car_id: string;
    customer_id: string | null;
    pickup_at: string;
    dropoff_at: string;
    price: number;
    mileage_out: number | null;
    mileage_in: number | null;
    fuel_out: number | null;
    fuel_in: number | null;
    notes: string | null;
    cancelled_at: string | null;
    confirmed_at: string | null;
    guest_name: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    guest_id_number: string | null;
    guest_drivers_license: string | null;
    guest_address: string | null;
    created_at: string;
}
