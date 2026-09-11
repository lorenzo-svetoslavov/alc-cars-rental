export interface Customer {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string | null;
    id_number: string | null;
    drivers_license: string | null;
    created_at: string;
    updated_at: string;
    email?: string;
}