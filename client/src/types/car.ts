export const CAR_OPTIONS = {
    transmission: {
        manual: "Manual",
        automatic: "Automatic",
    },
    fuel: {
        gasoline: "Gasoline",
        diesel: "Diesel",
        hybrid: "Hybrid",
        electric: "Electric",
    },
    category: {
        economy: "Economy",
        compact: "Compact",
        suv: "SUV",
        van: "Van",
        luxury: "Luxury",
    },
} as const;

export type CarOptionGroup = keyof typeof CAR_OPTIONS;
export type Transmission = keyof typeof CAR_OPTIONS.transmission;
export type FuelType = keyof typeof CAR_OPTIONS.fuel;
export type CarCategory = keyof typeof CAR_OPTIONS.category;

export function carOptions(group: CarOptionGroup) {
    return Object.entries(CAR_OPTIONS[group]).map(([value, label]) => ({ value, label }));
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
