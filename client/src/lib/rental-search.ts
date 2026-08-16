export interface RentalSearchConfig {
    /** Initial pickup value, usually coming from the query string */
    pickupAt?: string;
    /** Initial return value, usually coming from the query string */
    returnAt?: string;
    /** Block submit until both dates are selected */
    requireDates?: boolean;
    /** Show and require the "driver is 25+" confirmation */
    requireAge?: boolean;
}


/** Builds the x-data expression for a form using the shared date range logic */
export const rentalSearchData = (config: RentalSearchConfig = {}) => {
    const resolved: RentalSearchConfig = {
        pickupAt: "",
        returnAt: "",
        requireDates: true,
        requireAge: false,
        ...config,
    };

    return `rentalSearch(${JSON.stringify(resolved)})`;
};
