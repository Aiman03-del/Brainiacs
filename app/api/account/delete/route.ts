import { NextResponse } from "next/server";
import { createClient as createVerifierClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ATTACHMENT_BUCKET = "chat-attachments";
const AVATAR_BUCKET = "avatars";
const REMOVE_CHUNK = 100;
const CONFIRM_WORD = "DELETE";

type AdminClient = ReturnType<typeof createAdminClient>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function removeFiles(
  admin: AdminClient,
  bucket: string,
  paths: string[],
): Promise<void> {
  for (let index = 0; index < paths.length; index += REMOVE_CHUNK) {
    const { error } = await admin.storage
      .from(bucket)
      .remove(paths.slice(index, index + REMOVE_CHUNK));
    if (error) {
      console.error(`Failed to remove files from ${bucket}:`, error.message);
    }
  }
}

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const confirmation =
    isRecord(body) && typeof body.confirmation === "string" ? body.confirmation : "";
  const password =
    isRecord(body) && typeof body.password === "string" ? body.password : "";

  if (confirmation !== CONFIRM_WORD) {
    return NextResponse.json(
      { error: `Type ${CONFIRM_WORD} to confirm.` },
      { status: 400 },
    );
  }

  const providers: string[] = user.identities?.length
    ? user.identities.map((identity) => identity.provider)
    : (user.app_metadata?.providers ?? []);

  if (providers.includes("email")) {
    if (!password || !user.email) {
      return NextResponse.json(
        { error: "Enter your password to confirm." },
        { status: 400 },
      );
    }

    const verifier = createVerifierClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error: passwordError } = await verifier.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (passwordError) {
      return NextResponse.json(
        { error: "Your password is incorrect." },
        { status: 403 },
      );
    }
  }

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch (error: unknown) {
    console.error("Account deletion is not configured:", error);
    return NextResponse.json(
      { error: "Account deletion is not configured on this server." },
      { status: 500 },
    );
  }

  const { data: attachmentPaths, error: dataError } = await admin.rpc(
    "delete_user_data",
    { p_user_id: user.id },
  );
  if (dataError) {
    console.error("delete_user_data failed:", dataError.message);
    return NextResponse.json(
      { error: "Unable to delete your data. Please try again." },
      { status: 500 },
    );
  }

  await removeFiles(admin, ATTACHMENT_BUCKET, attachmentPaths ?? []);

  const { data: avatarFiles } = await admin.storage
    .from(AVATAR_BUCKET)
    .list(user.id, { limit: 1000 });
  await removeFiles(
    admin,
    AVATAR_BUCKET,
    (avatarFiles ?? []).map((file) => `${user.id}/${file.name}`),
  );

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("deleteUser failed:", deleteError.message);
    return NextResponse.json(
      {
        error:
          "Your data was removed, but the account could not be fully deleted. Please try again.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
