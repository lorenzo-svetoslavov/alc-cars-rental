export interface Booking {
    id: string;
    car_id: string;
    pickup_at: string;
    dropoff_at: string;
    cancelled_at: string | null;
    guest_name: string | null;
}
