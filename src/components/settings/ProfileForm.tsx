"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, RotateCcw } from "lucide-react";
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
  const [savedProfile, setSavedProfile] = useState(profile);
  const [name, setName] = useState(profile.display_name ?? "");
  const [file, setFile] = useState<ImageFile | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty =
    name !== (savedProfile.display_name ?? "") ||
    file !== null ||
    removePhoto;

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
    if (busy) return;
    setError("");
    setMessage("");

    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      setError("Name must be between 2 and 50 characters.");
      return;
    }

    setBusy(true);

    let photoUrl = savedProfile.photo_url;
    let uploadedPath: string | null = null;
    let oldPath: string | null = null;

    if (removePhoto) {
      photoUrl = null;
      oldPath = pathFromUrl(savedProfile.photo_url);
    }

    try {
      if (file) {
        const path = `${userId}/avatar-${Date.now()}.${TYPES[file.type]}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { contentType: file.type });

        if (uploadError) {
          setError("Unable to upload this photo. Please try another image.");
          return;
        }

        uploadedPath = path;
        photoUrl = supabase.storage.from("avatars").getPublicUrl(path)
          .data.publicUrl;
        oldPath = pathFromUrl(savedProfile.photo_url);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ display_name: cleanName, photo_url: photoUrl })
        .eq("id", userId);

      if (updateError) {
        if (uploadedPath) {
          await supabase.storage.from("avatars").remove([uploadedPath]);
        }
        setError("Unable to save your profile. Please try again.");
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
      setName(cleanName);
      setSavedProfile({ ...savedProfile, display_name: cleanName, photo_url: photoUrl });
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

  const resetChanges = () => {
    setName(savedProfile.display_name ?? "");
    setFile(null);
    setPreview(null);
    setRemovePhoto(false);
    setError("");
    setMessage("");
  };

  const shownPhoto = removePhoto ? null : (preview ?? savedProfile.photo_url);
  const fieldClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 border-y border-border py-5"
    >
      <h3 className="text-base font-semibold text-foreground">Personal information</h3>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={name || profile.email} src={shownPhoto} size={72} />
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            aria-label="Choose a profile photo"
            accept="image/jpeg,image/png,image/webp"
            onChange={pickFile}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              <Camera aria-hidden="true" className="h-4 w-4" />
              Change photo
            </button>
            {(savedProfile.photo_url || preview) && !removePhoto && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setRemovePhoto(true);
                }}
                disabled={busy}
                className="min-h-10 rounded-lg border border-danger px-3 text-sm text-danger hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-muted">JPG, PNG or WebP, up to 2 MB.</p>
        </div>
      </div>

      <div>
        <label htmlFor="profile-display-name" className="mb-1 block text-sm font-medium text-foreground">
          Display name
        </label>
        <input
          id="profile-display-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          maxLength={50}
          required
          disabled={busy}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="profile-email" className="mb-1 block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={profile.email ?? ""}
          readOnly
          autoComplete="email"
          className={`${fieldClass} bg-surface-muted`}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {message && (
        <p role="status" aria-live="polite" className="text-sm text-success">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={busy || !dirty}
          className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Uploading and saving..." : "Save changes"}
        </button>
        {dirty && (
          <button
            type="button"
            onClick={resetChanges}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Discard changes
          </button>
        )}
      </div>
    </form>
  );
}
