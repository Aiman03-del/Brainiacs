import { NextResponse } from "next/server";
import { createClient as createVerifierClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ATTACHMENT_BUCKET = "chat-attachments";
const AVATAR_BUCKET = "avatars";
const REMOVE_CHUNK = 100;
const QUERY_PAGE_SIZE = 1000;
const CONFIRM_WORD = "DELETE";

type AdminClient = ReturnType<typeof createAdminClient>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isSafePathSegment(segment: string): boolean {
  return (
    segment.length > 0 &&
    segment !== "." &&
    segment !== ".." &&
    !segment.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(segment)
  );
}

function isSafeStoragePath(path: string): boolean {
  return (
    path.length > 0 &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    path.split("/").every(isSafePathSegment)
  );
}

async function getUserAttachmentPaths(
  admin: AdminClient,
  userId: string,
): Promise<Set<string> | null> {
  const paths = new Set<string>();

  try {
    for (let offset = 0; ; offset += QUERY_PAGE_SIZE) {
      const { data, error } = await admin
        .from("messages")
        .select("id, board_id, sender_id, attachments")
        .eq("sender_id", userId)
        .order("id", { ascending: true })
        .range(offset, offset + QUERY_PAGE_SIZE - 1);
      if (error) {
        console.error("Unable to inspect account attachment records:", error.message);
        return null;
      }

      for (const message of data) {
        if (message.sender_id !== userId) {
          console.error("Attachment query returned a message for another user.");
          return null;
        }

        const attachmentData: unknown = message.attachments;
        if (attachmentData === null) continue;
        if (!isUnknownArray(attachmentData)) {
          console.error("Account message contains malformed attachment metadata.");
          return null;
        }

        for (const attachment of attachmentData) {
          if (
            !isRecord(attachment) ||
            typeof attachment.path !== "string" ||
            !isSafeStoragePath(attachment.path) ||
            !attachment.path.startsWith(`${message.board_id}/`)
          ) {
            console.error("Account message contains an invalid attachment path.");
            return null;
          }
          paths.add(attachment.path);
        }
      }

      if (data.length < QUERY_PAGE_SIZE) break;
    }
  } catch (error: unknown) {
    console.error("Unable to inspect account attachment records:", error);
    return null;
  }

  return paths;
}

async function listFilesRecursively(
  admin: AdminClient,
  bucket: string,
  rootPrefix: string,
): Promise<string[] | null> {
  const pendingPrefixes = [rootPrefix];
  const visitedPrefixes = new Set<string>();
  const paths: string[] = [];

  try {
    while (pendingPrefixes.length > 0) {
      const prefix = pendingPrefixes.pop();
      if (!prefix || visitedPrefixes.has(prefix)) continue;
      visitedPrefixes.add(prefix);

      for (let offset = 0; ; offset += QUERY_PAGE_SIZE) {
        const { data, error } = await admin.storage.from(bucket).list(prefix, {
          limit: QUERY_PAGE_SIZE,
          offset,
          sortBy: { column: "name", order: "asc" },
        });
        if (error) {
          console.error(`Unable to list files from ${bucket}:`, error.message);
          return null;
        }

        const entries = data ?? [];
        for (const entry of entries) {
          if (!isSafePathSegment(entry.name)) {
            console.error(`Storage listing returned an invalid path in ${bucket}.`);
            return null;
          }

          const path = `${prefix}/${entry.name}`;
          if (!path.startsWith(`${rootPrefix}/`) || !isSafeStoragePath(path)) {
            console.error(`Storage listing returned a path outside ${bucket}/${rootPrefix}.`);
            return null;
          }

          if (entry.id === null) {
            pendingPrefixes.push(path);
          } else {
            paths.push(path);
          }
        }

        if (entries.length < QUERY_PAGE_SIZE) break;
      }
    }
  } catch (error: unknown) {
    console.error(`Unable to list files from ${bucket}:`, error);
    return null;
  }

  return paths;
}

async function removeFiles(
  admin: AdminClient,
  bucket: string,
  paths: string[],
): Promise<boolean> {
  let succeeded = true;

  for (let index = 0; index < paths.length; index += REMOVE_CHUNK) {
    try {
      const { error } = await admin.storage
        .from(bucket)
        .remove(paths.slice(index, index + REMOVE_CHUNK));
      if (error) {
        console.error(`Failed to remove files from ${bucket}:`, error.message);
        succeeded = false;
      }
    } catch (error: unknown) {
      console.error(`Failed to remove files from ${bucket}:`, error);
      succeeded = false;
    }
  }

  return succeeded;
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

  const hasEmailPasswordIdentity = providers.includes("email");
  if (!hasEmailPasswordIdentity) {
    return NextResponse.json(
      {
        error:
          "Google reauthentication is required before deleting an OAuth-only account.",
      },
      { status: 403 },
    );
  }

  if (hasEmailPasswordIdentity) {
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

  const userAttachmentPaths = await getUserAttachmentPaths(admin, user.id);
  if (!userAttachmentPaths) {
    return NextResponse.json(
      { error: "Unable to verify your stored files. Please try again." },
      { status: 500 },
    );
  }

  const avatarPaths = await listFilesRecursively(admin, AVATAR_BUCKET, user.id);
  if (!avatarPaths) {
    return NextResponse.json(
      { error: "Unable to inspect your profile photos. Please try again." },
      { status: 500 },
    );
  }

  let rpcResult;
  try {
    rpcResult = await admin.rpc("delete_user_data", { p_user_id: user.id });
  } catch (error: unknown) {
    console.error("delete_user_data request failed:", error);
    return NextResponse.json(
      { error: "Unable to delete your data. Please try again." },
      { status: 500 },
    );
  }

  const { data: attachmentPaths, error: dataError } = rpcResult;
  if (dataError) {
    console.error("delete_user_data failed:", dataError.message);
    return NextResponse.json(
      { error: "Unable to delete your data. Please try again." },
      { status: 500 },
    );
  }

  const rpcPaths: unknown = attachmentPaths;
  if (
    !isUnknownArray(rpcPaths) ||
    !rpcPaths.every(
      (path): path is string =>
        typeof path === "string" && isSafeStoragePath(path),
    )
  ) {
    console.error("delete_user_data returned an invalid attachment path list.");
    return NextResponse.json(
      { error: "Unable to verify your stored files. Please try again." },
      { status: 500 },
    );
  }

  const requestedPaths = [...new Set(rpcPaths)];
  const safeAttachmentPaths = requestedPaths.filter((path) =>
    userAttachmentPaths.has(path),
  );
  const skippedPathCount = requestedPaths.length - safeAttachmentPaths.length;
  if (skippedPathCount > 0) {
    console.warn(
      `Skipped ${skippedPathCount} attachment path(s) not present in the user's messages.`,
    );
  }

  const attachmentsRemoved = await removeFiles(
    admin,
    ATTACHMENT_BUCKET,
    safeAttachmentPaths,
  );
  const avatarsRemoved = await removeFiles(admin, AVATAR_BUCKET, avatarPaths);
  if (!attachmentsRemoved || !avatarsRemoved) {
    return NextResponse.json(
      {
        error:
          "Account deletion could not be completed. Some files may remain; please try again.",
      },
      { status: 500 },
    );
  }

  try {
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
  } catch (error: unknown) {
    console.error("deleteUser request failed:", error);
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
