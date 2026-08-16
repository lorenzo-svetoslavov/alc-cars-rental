export const CAR_OPTIONS = {
    transmission: {
        manual: "Manual",
        automatic: "Automatic",
    },
    fuel: {
        gasoline: "Gasoline",
        diesel: "Diesel",
        hybrid: "Hybrid",
        plug_in_hybrid: "Plug-in hybrid",
        electric: "Electric",
        lpg: "LPG",
    },
    category: {
        mini: "Mini",
        compact: "Compact",
        sedan: "Sedan",
        suv: "SUV",
        minivan: "Minivan",
        van: "Van",
        premium: "Premium",
    },
} as const;

export type CarOptionGroup = keyof typeof CAR_OPTIONS;
export type Transmission = keyof typeof CAR_OPTIONS.transmission;
export type FuelType = keyof typeof CAR_OPTIONS.fuel;
export type CarCategory = keyof typeof CAR_OPTIONS.category;

/** Options of a group, ready to render a <select>: [{ value, label }, ...] */
export function carOptions(group: CarOptionGroup) {
    return Object.entries(CAR_OPTIONS[group]).map(([value, label]) => ({ value, label }));
}

/** Values of a group, e.g. ["manual", "automatic"] for transmission */
export function carOptionValues(group: CarOptionGroup) {
    return Object.keys(CAR_OPTIONS[group]);
}

export interface Car {
    id: string;
    make: string;
    model: string;
    plate_number: string;
    model_year: number;
    color: string | null;
    transmission: Transmission;
    fuel: FuelType;
    category: CarCategory;
    mileage: number;
    seats: number;
    doors: number;
    air_conditioning: boolean;
    daily_rate: number;
    available: boolean;
    image_url: string;
    created_at: string;
    updated_at: string;
}
