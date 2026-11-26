import { requireSupabase } from '../supabase';

export const signUp = (email: string, password: string, fullName: string) => requireSupabase().auth.signUp({ email, password, options: { data: { full_name: fullName } } });
export const signIn = (email: string, password: string) => requireSupabase().auth.signInWithPassword({ email, password });
export const signOut = () => requireSupabase().auth.signOut();
export const resetPassword = (email: string) => requireSupabase().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password.html` });
export const updatePassword = (password: string) => requireSupabase().auth.updateUser({ password });

export async function currentProfile() {
  const client = requireSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  const { data, error } = await client.from('profiles').select('id,full_name,phone,role,is_active').eq('id', user.id).single();
  if (error) throw new Error(error.message);
  return { user, profile: data };
}
