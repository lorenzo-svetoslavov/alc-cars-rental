export type StaffRole = "admin" | "worker";

export interface StaffMember {
    id: string;
    role: StaffRole;
    first_name: string;
    last_name: string;
    active: boolean;
    created_at: string;
    updated_at: string;
    email?: string | null;
}