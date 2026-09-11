import { supabase } from './supabase';
import type { Profile } from '../contexts/AuthContext';

export interface RegisterInput {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  balance?: number;
}

export interface RegisterResult {
  success: boolean;
  data?: Profile;
  error?: string;
}

/**
 * Shared registration logic used by both AuthForms (self-register)
 * and CreateUserModal (admin creates user).
 */
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const { username, firstName, lastName, email, password, balance = 0 } = input;

  // Check for duplicate username or email
  const { data: existingUsers, error: checkError } = await supabase
    .from('profiles')
    .select('username, email')
    .or(`username.eq.${username},email.eq.${email}`);

  if (checkError) {
    return { success: false, error: 'Error checking for duplicates. Please try again.' };
  }

  if (existingUsers && existingUsers.length > 0) {
    const hasUsername = existingUsers.some((u: any) => u.username === username);
    const hasEmail = existingUsers.some((u: any) => u.email === email);

    if (hasUsername) return { success: false, error: 'This username is already taken.' };
    if (hasEmail) return { success: false, error: 'This email is already registered.' };
  }

  // Insert new profile directly (custom auth — no Supabase Auth)
  const { data, error: insertError } = await supabase
    .from('profiles')
    .insert([
      {
        id: crypto.randomUUID(),
        username,
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        balance,
      },
    ])
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: 'User with that username or email already exists.' };
    }
    return { success: false, error: insertError.message };
  }

  return { success: true, data: data as Profile };
}
