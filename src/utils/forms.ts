import { supabase } from "../lib/supabase";

export type FormData = {
  id?: string;
  user_id?: string;
  title: string;
  form_data: Record<string, any>;
  status: "active" | "submitted";
  public_id?: string;
  is_public?: boolean;
  author_name?: string;
  created_at?: string;
  updated_at?: string;
};

// Create a new form
export async function createForm(title: string, formData: Record<string, any>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("forms")
    .insert({
      user_id: user.id,
      title,
      form_data: formData,
      status: "active",
    })
    .select()
    .single();

  return { data, error };
}

// Update an existing form
export async function updateForm(
  formId: string,
  title: string,
  formData: Record<string, any>,
) {
  const { data, error } = await supabase
    .from("forms")
    .update({
      title,
      form_data: formData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", formId)
    .select()
    .single();

  return { data, error };
}

// Get all active forms for the current user
export async function getActiveForms() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  return { data, error };
}

// Get a specific form by ID
export async function getFormById(formId: string) {
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("id", formId)
    .single();

  return { data, error };
}

// Delete a form
export async function deleteForm(formId: string) {
  const { error } = await supabase.from("forms").delete().eq("id", formId);

  return { error };
}

// Submit a form (change status to submitted)
export async function submitForm(formId: string) {
  const { data, error } = await supabase
    .from("forms")
    .update({ status: "submitted" })
    .eq("id", formId)
    .select()
    .single();

  return { data, error };
}

// Publish a form to make it publicly accessible
export async function publishForm(
  formId: string,
  title: string,
  formData: Record<string, any>,
  authorName: string,
) {
  const { data, error } = await supabase
    .from("forms")
    .update({
      title,
      form_data: formData,
      is_public: true,
      author_name: authorName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", formId)
    .select()
    .single();

  return { data, error };
}

// Unpublish a form (make it private again)
export async function unpublishForm(formId: string) {
  const { data, error } = await supabase
    .from("forms")
    .update({ is_public: false })
    .eq("id", formId)
    .select()
    .single();

  return { data, error };
}

// Get a public form by its public_id (no auth required)
export async function getPublicFormByPublicId(publicId: string) {
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("public_id", publicId)
    .eq("is_public", true)
    .single();

  return { data, error };
}

// Get all published forms for the current user
export async function getPublishedForms() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });

  return { data, error };
}
