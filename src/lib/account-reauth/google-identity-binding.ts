export interface AuthenticatedUserLookupResult {
  data: { user: unknown };
  error: unknown;
}

export interface AdminUserLookupResult {
  data: { user: unknown };
  error: unknown;
}

export type AuthenticatedUserLookup = () => Promise<AuthenticatedUserLookupResult>;
export type AdminUserLookup = (userId: string) => Promise<AdminUserLookupResult>;

export interface GoogleIdentityBindingOptions {
  getAuthenticatedUser: AuthenticatedUserLookup;
  getAdminUserById: AdminUserLookup;
  validatedGoogleSubject: unknown;
}

export type GoogleIdentityBindingResult =
  | { valid: true; authenticatedUserId: string }
  | {
      valid: false;
      reason:
        | "invalid-token-subject"
        | "authenticated-user-lookup-failed"
        | "authenticated-user-missing"
        | "authenticated-user-malformed"
        | "admin-user-lookup-failed"
        | "admin-user-missing"
        | "admin-user-malformed"
        | "admin-user-mismatch"
        | "identities-malformed"
        | "google-identity-missing"
        | "google-identity-ambiguous"
        | "google-identity-user-mismatch"
        | "identity-data-malformed"
        | "identity-subject-invalid"
        | "identity-subject-mismatch";
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function invalid(
  reason: Exclude<GoogleIdentityBindingResult, { valid: true }>["reason"],
): GoogleIdentityBindingResult {
  return { valid: false, reason };
}

export async function bindGoogleIdentity(
  options: GoogleIdentityBindingOptions,
): Promise<GoogleIdentityBindingResult> {
  if (!isNonEmptyString(options.validatedGoogleSubject)) {
    return invalid("invalid-token-subject");
  }

  let authenticatedResult: AuthenticatedUserLookupResult;
  try {
    authenticatedResult = await options.getAuthenticatedUser();
  } catch {
    return invalid("authenticated-user-lookup-failed");
  }

  if (authenticatedResult.error) {
    return invalid("authenticated-user-lookup-failed");
  }

  if (!isRecord(authenticatedResult.data)) {
    return invalid("authenticated-user-missing");
  }

  const authenticatedUser = authenticatedResult.data.user;
  if (authenticatedUser === null || authenticatedUser === undefined) {
    return invalid("authenticated-user-missing");
  }

  if (!isRecord(authenticatedUser) || !isNonEmptyString(authenticatedUser.id)) {
    return invalid("authenticated-user-malformed");
  }

  const authenticatedUserId = authenticatedUser.id;

  let adminResult: AdminUserLookupResult;
  try {
    adminResult = await options.getAdminUserById(authenticatedUserId);
  } catch {
    return invalid("admin-user-lookup-failed");
  }

  if (adminResult.error) {
    return invalid("admin-user-lookup-failed");
  }

  if (!isRecord(adminResult.data)) {
    return invalid("admin-user-missing");
  }

  const adminUser = adminResult.data.user;
  if (adminUser === null || adminUser === undefined) {
    return invalid("admin-user-missing");
  }

  if (!isRecord(adminUser) || !isNonEmptyString(adminUser.id)) {
    return invalid("admin-user-malformed");
  }

  if (adminUser.id !== authenticatedUserId) {
    return invalid("admin-user-mismatch");
  }

  if (!Array.isArray(adminUser.identities)) {
    return invalid("identities-malformed");
  }

  if (
    !adminUser.identities.every(
      (identity) =>
        isRecord(identity) && isNonEmptyString(identity.provider),
    )
  ) {
    return invalid("identities-malformed");
  }

  const googleIdentities = adminUser.identities.filter(
    (identity) => identity.provider === "google",
  );

  if (googleIdentities.length === 0) {
    return invalid("google-identity-missing");
  }

  if (googleIdentities.length !== 1) {
    return invalid("google-identity-ambiguous");
  }

  const googleIdentity = googleIdentities[0];
  if (googleIdentity.user_id !== authenticatedUserId) {
    return invalid("google-identity-user-mismatch");
  }

  if (!isRecord(googleIdentity.identity_data)) {
    return invalid("identity-data-malformed");
  }

  const identitySubject = googleIdentity.identity_data.sub;
  if (!isNonEmptyString(identitySubject)) {
    return invalid("identity-subject-invalid");
  }

  if (identitySubject !== options.validatedGoogleSubject) {
    return invalid("identity-subject-mismatch");
  }

  return { valid: true, authenticatedUserId };
}
