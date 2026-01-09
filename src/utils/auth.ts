import { supabase } from "../lib/supabase";

// Creates a new user account with email and password
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

// Signs in an existing user with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// Signs out the current user and clears their session
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Gets the currently authenticated user
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Sends a password reset email
export async function resetPassword(email: string, redirectTo: string) {
  if (redirectTo) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return { error };
  }
  // Use default redirect URL from Supabase dashboard
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return { error };
}

// Updates the user's password
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}
