export type Transmission = "manual" | "automatic";
export type FuelType = "gasoline" | "diesel" | "hybrid" | "electric";
export type CarCategory = "economy" | "compact" | "suv" | "van" | "luxury";

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