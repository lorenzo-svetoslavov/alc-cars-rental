import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

export function onAuthChange(callback: (session: Session | null) => void) {
	const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
		callback(session);
	});
	return subscription;
}

export async function getSession() {
	const { data: { session } } = await supabase.auth.getSession();
	return session;
}

export async function getUser() {
	const { data: { user } } = await supabase.auth.getUser();
	return user;
}

export async function signOut() {
	const { error } = await supabase.auth.signOut();
	if (error) throw error;
}