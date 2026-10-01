"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";
import type { Profile } from "@/types";

const MAX_BYTES = 2 * 1024 * 1024;
type ImageMime = "image/jpeg" | "image/png" | "image/webp";
type ImageFile = File & { type: ImageMime };
const TYPES: Record<ImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function isImageMime(type: string): type is ImageMime {
  return type in TYPES;
}

function pathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = "/avatars/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

interface ProfileFormProps {
  userId: string;
  profile: Pick<Profile, "display_name" | "email" | "photo_url">;
}

export default function ProfileForm({ userId, profile }: ProfileFormProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [name, setName] = useState(profile.display_name ?? "");
  const [file, setFile] = useState<ImageFile | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;

    setError("");
    setMessage("");

    if (!isImageMime(picked.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError("Image is too large (max 2 MB).");
      return;
    }

    setFile(picked as ImageFile);
    setPreview(URL.createObjectURL(picked));
    setRemovePhoto(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      setError("Name must be between 2 and 50 characters.");
      return;
    }

    setBusy(true);

    let photoUrl = profile.photo_url;
    let uploadedPath = null;
    let oldPath = null;

    if (removePhoto) {
      photoUrl = null;
      oldPath = pathFromUrl(profile.photo_url);
    }

    try {
      if (file) {
        const path = `${userId}/avatar-${Date.now()}.${TYPES[file.type]}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { contentType: file.type });

        if (uploadError) {
          setError(uploadError.message);
          return;
        }

        uploadedPath = path;
        photoUrl = supabase.storage.from("avatars").getPublicUrl(path)
          .data.publicUrl;
        oldPath = pathFromUrl(profile.photo_url);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ display_name: cleanName, photo_url: photoUrl })
        .eq("id", userId);

      if (updateError) {
        if (uploadedPath) {
          await supabase.storage.from("avatars").remove([uploadedPath]);
        }
        setError(updateError.message);
        return;
      }

      if (
        oldPath &&
        oldPath.startsWith(`${userId}/`) &&
        oldPath !== uploadedPath
      ) {
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      setFile(null);
      setPreview(null);
      setRemovePhoto(false);
      setMessage("Profile updated.");
      router.refresh();
    } catch {
      if (uploadedPath) {
        await supabase.storage.from("avatars").remove([uploadedPath]);
      }
      setError("Unable to update your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const shownPhoto = removePhoto ? null : (preview ?? profile.photo_url);
  const fieldClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border bg-surface p-6"
    >
      <h2 className="text-lg font-semibold text-foreground">Profile</h2>

      <div className="flex items-center gap-4">
        <Avatar name={name || profile.email} src={shownPhoto} size={72} />
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={pickFile}
            className="hidden"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover"
            >
              Change photo
            </button>
            {(profile.photo_url || preview) && !removePhoto && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setRemovePhoto(true);
                }}
                className="rounded-lg border border-danger px-3 py-1.5 text-sm text-danger hover:bg-danger-soft"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-muted">JPG, PNG or WebP, up to 2 MB.</p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Display name
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={50}
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          value={profile.email ?? ""}
          disabled
          className={`${fieldClass} cursor-not-allowed opacity-70`}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-success">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {busy ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
