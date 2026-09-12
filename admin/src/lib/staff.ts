import { supabaseAdmin } from "@/lib/supabase-admin";
import type { StaffMember, StaffRole } from "@/types/staff";

export type StaffUpdate = Partial<
    Omit<StaffMember, "id" | "created_at" | "updated_at" | "email">
>;

export interface NewStaffInput {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: StaffRole;
}

export interface UpdateStaffInput {
    first_name: string;
    last_name: string;
    role: StaffRole;
}

export async function getStaff(): Promise<StaffMember[]> {
    const { data: staffList, error } = await supabaseAdmin
        .from("staff")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

    if (error) {
        throw new Error(`Error al obtener el personal: ${error.message}`);
    }

    if (!staffList || staffList.length === 0) {
        return [];
    }

    const { data: users, error: usersError } =
        await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
        throw new Error(`Error al obtener usuarios: ${usersError.message}`);
    }

    const emailMap = new Map<string, string>();
    for (const user of users?.users ?? []) {
        if (user.email) {
            emailMap.set(user.id, user.email);
        }
    }

    return staffList.map((member) => ({
        ...member,
        email: emailMap.get(member.id) ?? null,
    })) as StaffMember[];
}

export async function getStaffMemberById(
    id: string,
): Promise<StaffMember | null> {
    const { data: member, error } = await supabaseAdmin
        .from("staff")
        .select("*")
        .is("deleted_at", null)
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw new Error(`Error al obtener el miembro del equipo: ${error.message}`);
    }

    if (!member) {
        return null;
    }

    const { data: user, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(id);

    if (userError) {
        throw new Error(`Error al obtener el usuario: ${userError.message}`);
    }

    return {
        ...(member as StaffMember),
        email: user?.user?.email ?? null,
    };
}

export async function createStaffMember(input: NewStaffInput): Promise<void> {
    const { data: created, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
            email: input.email,
            password: input.password,
            email_confirm: true,
            app_metadata: { staff: true, role: input.role },
            user_metadata: {
                first_name: input.first_name,
                last_name: input.last_name,
                name: `${input.first_name} ${input.last_name}`,
            },
        });

    if (authError || !created?.user) {
        throw new Error(`Error al crear el usuario: ${authError?.message}`);
    }

    const { error } = await supabaseAdmin
        .from("staff")
        .insert({
            id: created.user.id,
            role: input.role,
            first_name: input.first_name,
            last_name: input.last_name,
        });

    if (error) {
        await supabaseAdmin.auth.admin.deleteUser(created.user.id).catch(() => {});
        throw new Error(`Error al crear el miembro del equipo: ${error.message}`);
    }

    try {
        await supabaseAdmin
            .from("customers")
            .delete()
            .eq("id", created.user.id);
    } catch {
        // limpieza best-effort: no debe romper la creación
    }
}

export async function updateStaffMember(
    id: string,
    input: UpdateStaffInput,
): Promise<void> {
    const { error } = await supabaseAdmin
        .from("staff")
        .update({
            first_name: input.first_name,
            last_name: input.last_name,
            role: input.role,
        })
        .eq("id", id);

    if (error) {
        throw new Error(`Error al actualizar el miembro del equipo: ${error.message}`);
    }

    await supabaseAdmin.auth.admin
        .updateUserById(id, {
            app_metadata: { staff: true, role: input.role },
            user_metadata: { name: `${input.first_name} ${input.last_name}` },
        })
        .catch(() => {});
}

export async function setStaffMemberActive(
    id: string,
    active: boolean,
): Promise<void> {
    const { error } = await supabaseAdmin
        .from("staff")
        .update({ active })
        .eq("id", id);

    if (error) {
        throw new Error(`Error al actualizar el estado: ${error.message}`);
    }
}

export async function deleteStaffMember(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from("staff")
        .update({
            deleted_at: new Date().toISOString(),
            active: false,
        })
        .eq("id", id);

    if (error) {
        throw new Error(`Error al dar de baja el miembro: ${error.message}`);
    }
}