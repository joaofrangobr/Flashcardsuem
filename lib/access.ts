import { isActiveSubscription } from "./subscription";

export type AccessRole = "student" | "moderator" | "admin";

// Fallback de bootstrap para não perder o acesso administrativo em ambientes antigos.
const bootstrapAdminEmails = ["moderadorsite@gmail.com"];

export function isBootstrapAdminEmail(email?: string | null) {
  if (!email) return false;
  return bootstrapAdminEmails.includes(email.trim().toLowerCase());
}

export function getAccessRole(email?: string | null, profileRole?: string | null): AccessRole {
  if (profileRole === "admin") return "admin";
  if (profileRole === "moderator") return "moderator";
  if (isBootstrapAdminEmail(email)) return "admin";
  return "student";
}

export function canAccessPaidContent(
  role: AccessRole,
  subscription?: { status?: string | null; ends_at?: string | null } | null,
) {
  return role === "admin" || role === "moderator" || isActiveSubscription(subscription);
}

export function getDisplayName(
  email?: string | null,
  profileName?: string | null,
  profileRole?: string | null,
) {
  if (getAccessRole(email, profileRole) === "admin" && !profileName?.trim()) {
    return "Administrador";
  }

  return profileName?.trim() || "Aluno";
}
