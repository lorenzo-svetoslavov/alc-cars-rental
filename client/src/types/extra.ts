export type ExtraPricing = "per_day" | "per_booking";

export interface Extra {
    id: string;
    code: string;
    name: string;
    description: string;
    price: number;
    pricing: ExtraPricing;
    active: boolean;
}
