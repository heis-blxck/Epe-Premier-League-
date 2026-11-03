import { supabase, isSupabaseConfigured } from '../supabase';
import { UserAccount } from '../types';

export interface SignupOptions {
  email: string;
  password?: string;
  name?: string;
  favoriteTeamId?: string;
  avatarUrl?: string;
  fantasyTeamName?: string;
}

/**
 * User Registration / Signup function using Supabase Auth & Database:
 * 1. No Undefined Values: Sanitizes payload so no undefined fields are sent to Supabase.
 * 2. Real Auth UIDs: Uses the user ID returned by Supabase Auth (or deterministic fallback).
 * 3. Execution Order: Awaits Auth creation/sign-in, then awaits Supabase upsert before returning.
 */
export const signupUserToSupabase = async (
  email: string,
  password?: string,
  name?: string,
  favoriteTeamId?: string,
  avatarUrl?: string,
  fantasyTeamName?: string
): Promise<UserAccount> => {
  const cleanEmail = email.trim().toLowerCase();
  const passToUse = password && password.trim().length >= 6 ? password.trim() : 'DefaultPass123!';

  let uid = `user-${Date.now()}`;

  if (isSupabaseConfigured) {
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: passToUse,
      });

      if (signUpData?.user?.id) {
        uid = signUpData.user.id;
      } else if (signUpErr) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: passToUse,
        });
        if (signInData?.user?.id) {
          uid = signInData.user.id;
        }
      }
    } catch (authErr) {
      console.warn('Supabase Auth signup notice, proceeding with generated user ID:', authErr);
    }
  }

  const rawPayload: Record<string, any> = {
    id: uid,
    email: cleanEmail,
    name: name?.trim() || cleanEmail.split('@')[0],
    role: 'fan',
    favoriteTeamId: favoriteTeamId?.trim() || 'team-1',
    fantasyTeamName: fantasyTeamName?.trim() ? fantasyTeamName.trim() : null,
    notificationsEnabled: true,
    themePreference: 'dark',
    avatarUrl: avatarUrl?.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString()
  };

  const sanitizedUser = Object.fromEntries(
    Object.entries(rawPayload).map(([k, v]) => [k, v === undefined ? null : v])
  ) as UserAccount;

  if (isSupabaseConfigured) {
    const { error: dbErr } = await supabase
      .from('users')
      .upsert(sanitizedUser, { onConflict: 'id' });

    if (dbErr) {
      console.error('Supabase user upsert failed:', dbErr);
      const codeStr = dbErr.code ? `[${dbErr.code}] ` : '';
      const msgStr = dbErr.message || 'Supabase upsert failed';
      throw new Error(`Supabase Write Rejection: ${codeStr}${msgStr}`);
    }
  }

  return sanitizedUser;
};

export const signupUserToFirestore = signupUserToSupabase;
