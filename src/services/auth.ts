import { requireSupabase } from '../supabase';
import { config } from '../config';
import { safeReturnPath } from '../auth-navigation';
import { AccountAccessError } from '../account-access';

export const signUp = (email: string, password: string, fullName: string, returnTo?: string | null) => {
  const siteUrl = config?.VITE_SITE_URL ?? location.origin;
  const confirmationUrl = new URL('/sign-in.html', siteUrl);
  confirmationUrl.searchParams.set('returnTo', safeReturnPath(returnTo));
  confirmationUrl.searchParams.set('confirmation', 'signup');
  return requireSupabase().auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName.trim() },
      emailRedirectTo: confirmationUrl.toString(),
    },
  });
};
export const signIn = (email: string, password: string) => requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
export const signOut = () => requireSupabase().auth.signOut();
export async function signOutCurrentSession() {
  const client = requireSupabase();
  const result = await client.auth.signOut({ scope: 'local' });
  if (result.error) throw result.error;
  const verification = await client.auth.getSession();
  if (verification.error) throw verification.error;
  if (verification.data.session) throw new Error('Session cleanup could not be verified.');
}
export const resetPassword = (email: string) => {
  const siteUrl = config?.VITE_SITE_URL ?? location.origin;
  const redirectTo = new URL('/reset-password.html', siteUrl).toString();
  return requireSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo });
};
export const updatePassword = (password: string) => requireSupabase().auth.updateUser({ password });

export async function currentProfile() {
  const client = requireSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) {
    if (authError.name === 'AuthSessionMissingError') return null;
    throw new AccountAccessError('auth-user', authError);
  }
  if (!user) return null;
  const result = await client
    .from('profiles')
    .select('id,full_name,phone,role,is_active')
    .eq('id', user.id)
    .single();
  if (result.error) {
    throw new AccountAccessError('profile-read', result.error, result.status);
  }
  if (!result.data || result.data.id !== user.id) {
    throw new AccountAccessError('profile-read', { code: 'profile_unavailable' });
  }
  return { user, profile: result.data };
}

export type VerifiedAccountSession =
  NonNullable<Awaited<ReturnType<typeof currentProfile>>>;
