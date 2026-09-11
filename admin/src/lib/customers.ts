import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Customer } from "@/types/customer";

export async function getCustomers(): Promise<Customer[]> {
    const { data: customers, error: customersError } = await supabaseAdmin
        .from("customers")
        .select("*")
        .order("first_name", { ascending: true });

    if (customersError) {
        throw new Error(`Error al obtener los clientes: ${customersError.message}`);
    }

    if (!customers || customers.length === 0) {
        return [];
    }

    const customerIds = customers.map((c) => c.id);
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
        throw new Error(`Error al obtener usuarios: ${usersError.message}`);
    }

    const emailMap = new Map<string, string>();
    for (const user of users?.users ?? []) {
        if (customerIds.includes(user.id) && user.email) {
            emailMap.set(user.id, user.email);
        }
    }

    return customers.map((customer) => ({
        ...customer,
        email: emailMap.get(customer.id),
    })) as Customer[];
}