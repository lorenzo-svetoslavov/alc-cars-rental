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

export type Transmission = keyof typeof CAR_OPTIONS.transmission;
export type FuelType = keyof typeof CAR_OPTIONS.fuel;
export type CarCategory = keyof typeof CAR_OPTIONS.category;

/**
 * Fila completa de `cars`, tal cual está en la base de datos.
 * Para el catálogo público usa `CarSummary`: `plate_number` es dato interno.
 */
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

/**
 * Lo que devuelve `search_cars` y lo único que necesita una tarjeta del
 * catálogo. Si añades un campo aquí, añádelo también al `returns table` de la
 * función en Postgres.
 */
export type CarSummary = Pick<
    Car,
    | "id"
    | "make"
    | "model"
    | "model_year"
    | "transmission"
    | "fuel"
    | "seats"
    | "doors"
    | "air_conditioning"
    | "daily_rate"
    | "available"
    | "image_url"
>;
