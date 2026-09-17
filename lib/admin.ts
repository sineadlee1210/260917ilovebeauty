import { getCurrentUser } from "@/lib/content-access";

// Returns the signed-in user only if their email is on the admin allow-list,
// null otherwise. Used by every /admin page and /api/admin/* route so admin
// writes can never be reached by a non-admin, authenticated or not.
export async function getAdminUser() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

// Minimal admin allow-list check. The /admin area is single-operator (owner-only)
// for this MVP, so we gate by email against ADMIN_EMAILS rather than building
// a full roles system.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowList.includes(email.toLowerCase());
}
