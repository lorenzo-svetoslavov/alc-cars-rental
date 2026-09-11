import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Customer } from "@/types/customer";

export type CustomerUpdate = Partial<
    Omit<Customer, "id" | "created_at" | "updated_at" | "deleted_at" | "email">
>;

export interface GetCustomersOptions {
    page?: number;
    pageSize?: number;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
    const { data: customer, error } = await supabaseAdmin
        .from("customers")
        .select("*")
        .is("deleted_at", null)
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw new Error(`Error al obtener el cliente: ${error.message}`);
    }

    if (!customer) {
        return null;
    }

    const { data: user, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(id);

    if (userError) {
        throw new Error(`Error al obtener el usuario: ${userError.message}`);
    }

    return {
        ...(customer as Customer),
        email: user?.user?.email,
    };
}

export async function updateCustomer(
    id: string,
    updates: CustomerUpdate,
): Promise<void> {
    const { error } = await supabaseAdmin
        .from("customers")
        .update(updates)
        .eq("id", id);

    if (error) {
        throw new Error(`Error al actualizar el cliente: ${error.message}`);
    }
}

export async function deleteCustomer(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from("customers")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        throw new Error(`Error al dar de baja el cliente: ${error.message}`);
    }
}

export async function getCustomers(
    opts: GetCustomersOptions = {},
): Promise<{ data: Customer[]; count: number }> {
    const page = Math.max(1, Math.floor(opts.page ?? 1));
    const pageSize = Math.max(1, Math.floor(opts.pageSize ?? 10));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: customers, error: customersError, count } = await supabaseAdmin
        .from("customers")
        .select("*", { count: "exact" })
        .is("deleted_at", null)
        .range(from, to)
        .order("first_name", { ascending: true });

    if (customersError) {
        throw new Error(`Error al obtener los clientes: ${customersError.message}`);
    }

    if (!customers || customers.length === 0) {
        return { data: [], count: count ?? 0 };
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

    const data = customers.map((customer) => ({
        ...customer,
        email: emailMap.get(customer.id),
    })) as Customer[];

    return { data, count: count ?? data.length };
}