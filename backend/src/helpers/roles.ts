export type UserRole = "admin" | "supervisor" | "agent";

export const normalizeRole = (role?: string): UserRole => {
  if (role === "admin" || role === "supervisor") {
    return role;
  }
  return "agent";
};

export const hasRole = (role: string, allowed: UserRole[]): boolean =>
  allowed.includes(normalizeRole(role));
