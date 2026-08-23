export type AdminRole = "admin" | "editor" | "teacher" | "collaborator";

export const USER_ROLES: AdminRole[] = ["admin", "editor", "teacher", "collaborator"];
export const ADMIN_ROLES: AdminRole[] = ["admin", "editor"];

export function isUserRole(role: unknown): role is AdminRole {
  return typeof role === "string" && USER_ROLES.includes(role as AdminRole);
}

export function isAdminRole(role: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

export function canManageUsers(role: AdminRole) {
  return role === "admin";
}
