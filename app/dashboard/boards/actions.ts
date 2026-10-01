"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type BoardValues = {
  name: string;
  description: string;
  visibility: "Public" | "Private";
  theme: string;
};

export type ActionResult = { error: string } | { success: true; id?: string };

function parseBoardForm(formData: FormData): BoardValues {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const visibility =
    formData.get("visibility") === "Private" ? "Private" : "Public";
  const themeRaw = String(formData.get("theme") ?? "");
  const theme = /^#[0-9a-fA-F]{6}$/.test(themeRaw) ? themeRaw : "#3b82f6";

  return { name, description, visibility, theme };
}

export async function createBoard(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in." };

  const values = parseBoardForm(formData);
  if (!values.name) return { error: "Board name is required." };

  const { data, error } = await supabase
    .from("boards")
    .insert({ ...values, created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("activities").insert({
    board_id: data.id,
    user_id: user.id,
    entity: "Board",
    action: "Add",
    message: `A new board ${values.name} added`,
  });

  revalidatePath("/dashboard/boards");
  revalidatePath("/dashboard/messenger");
  return { success: true, id: data.id };
}

export async function updateBoard(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in." };

  const values = parseBoardForm(formData);
  if (!values.name) return { error: "Board name is required." };

  const { data, error } = await supabase
    .from("boards")
    .update(values)
    .eq("id", id)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Only the board owner can edit this board." };
  }

  await supabase.from("activities").insert({
    board_id: id,
    user_id: user.id,
    entity: "Board",
    action: "Update",
    message: `Board updated to ${values.name}`,
  });

  revalidatePath("/dashboard/boards");
  return { success: true };
}

export async function deleteBoard(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in." };

  const { data, error } = await supabase
    .from("boards")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Only the board owner can delete this board." };
  }

  revalidatePath("/dashboard/boards");
  return { success: true };
}
