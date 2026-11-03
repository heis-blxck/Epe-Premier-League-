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

const MIN_PASSWORD_LENGTH = 6;

function isAlreadyRegistered(message: string | undefined): boolean {
  const value = (message || '').toLowerCase();
  return (
    value.includes('already registered') ||
    value.includes('already been registered') ||
    value.includes('already exists') ||
    value.includes('user already')
  );
}

function mapAuthError(error: { message?: string }, action: string): Error {
  const message = error?.message?.trim() || 'Unknown authentication error.';
  const lower = message.toLowerCase();

  if (lower.includes('password')) {
    return new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }
  if (lower.includes('email') && (lower.includes('invalid') || lower.includes('validate'))) {
    return new Error('Please enter a valid email address.');
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return new Error('Too many attempts. Please wait a moment and try again.');
  }
  if (lower.includes('email not confirmed')) {
    return new Error('This account exists but its email has not been confirmed. Please check your inbox.');
  }

  return new Error(`${action}: ${message}`);
}

function mapProfileError(error: { code?: string; message?: string }): Error {
  const code = error?.code ? `[${error.code}] ` : '';
  const message = error?.message || 'Unknown Supabase error.';
  return new Error(`Could not save your profile to Supabase: ${code}${message}`);
}

function removeUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined)
  ) as Partial<T>;
}

async function signInExistingAccount(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password }).catch(() => {
    throw new Error('Unable to reach Supabase authentication. Please check your internet connection and try again.');
  });

  if (error || !data?.user?.id) {
    if (error?.message?.toLowerCase().includes('email not confirmed')) {
      throw new Error('This account exists but its email has not been confirmed. Please check your inbox.');
    }
    throw new Error('An account with this email already exists. Please sign in with the correct password.');
  }

  return data.user.id;
}

/**
 * Creates a Supabase Auth account (or verifies an existing one) and stores the
 * matching profile in the `users` table.
 *
 * The profile row uses the exact camelCase columns that exist in Supabase:
 * id, email, name, role, favoriteTeamId, fantasyTeamName, notificationsEnabled,
 * themePreference, avatarUrl, createdAt.
 */
export const signupUserToSupabase = async (
  email: string,
  password?: string,
  name?: string,
  favoriteTeamId?: string,
  avatarUrl?: string,
  fantasyTeamName?: string
): Promise<UserAccount> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase authentication is not configured. Please contact the league administrator.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password ?? '';
  const cleanName = name?.trim() || cleanEmail.split('@')[0];
  const cleanFavoriteTeamId = favoriteTeamId?.trim() || undefined;
  const cleanAvatarUrl = avatarUrl?.trim() || undefined;
  const cleanFantasyTeamName = fantasyTeamName?.trim() || undefined;

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (cleanPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }

  let uid = '';

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
    options: {
      data: { name: cleanName }
    }
  }).catch(() => {
    throw new Error('Unable to reach Supabase authentication. Please check your internet connection and try again.');
  });

  if (signUpError) {
    if (isAlreadyRegistered(signUpError.message)) {
      uid = await signInExistingAccount(cleanEmail, cleanPassword);
    } else {
      throw mapAuthError(signUpError, 'Account creation failed');
    }
  } else {
    const user = signUpData.user;

    if (!user?.id) {
      throw new Error('Account creation failed: Supabase did not return a user ID. Please try again.');
    }

    // Supabase can return an existing user with an empty identities array
    // instead of an error when email confirmation is enabled.
    const isExistingAccount = Array.isArray(user.identities) && user.identities.length === 0;
    uid = isExistingAccount ? await signInExistingAccount(cleanEmail, cleanPassword) : user.id;
  }

  // Look up an existing profile by email so legacy rows keep their original
  // id and role instead of being duplicated under the new Auth UID.
  const { data: existingRows, error: lookupError } = await supabase
    .from('users')
    .select('id, createdAt')
    .eq('email', cleanEmail)
    .limit(1);

  if (lookupError) {
    throw mapProfileError(lookupError);
  }

  if (existingRows && existingRows.length > 0) {
    const existing = existingRows[0];
    const existingId = String(existing.id);

    const profileUpdate = removeUndefined({
      name: cleanName,
      favoriteTeamId: cleanFavoriteTeamId,
      avatarUrl: cleanAvatarUrl,
      fantasyTeamName: cleanFantasyTeamName
    });

    if (Object.keys(profileUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(profileUpdate)
        .eq('id', existingId);

      if (updateError) {
        throw mapProfileError(updateError);
      }
    }

    return {
      id: existingId,
      email: cleanEmail,
      name: cleanName,
      role: 'fan',
      favoriteTeamId: cleanFavoriteTeamId,
      avatarUrl: cleanAvatarUrl,
      fantasyTeamName: cleanFantasyTeamName,
      notificationsEnabled: true,
      themePreference: 'dark',
      createdAt: existing.createdAt || new Date().toISOString()
    };
  }

  const createdAt = new Date().toISOString();
  const newProfile = removeUndefined({
    id: uid,
    email: cleanEmail,
    name: cleanName,
    role: 'fan',
    favoriteTeamId: cleanFavoriteTeamId,
    fantasyTeamName: cleanFantasyTeamName,
    notificationsEnabled: true,
    themePreference: 'dark',
    avatarUrl: cleanAvatarUrl,
    createdAt
  });

  const { error: insertError } = await supabase.from('users').insert(newProfile);

  if (insertError) {
    throw mapProfileError(insertError);
  }

  return newProfile as unknown as UserAccount;
};

export const signupUserToFirestore = signupUserToSupabase;
