export type Session = { token: string; email: string; name?: string };
export const sessionKey = "job-tracker-session";

export function readSession(): Session | null {
  try {
    const value: unknown = JSON.parse(
      sessionStorage.getItem(sessionKey) ?? "null",
    );
    if (typeof value !== "object" || value === null) return null;
    if (!("token" in value) || !("email" in value)) return null;
    if (typeof value.token !== "string" || typeof value.email !== "string")
      return null;
    return { token: value.token, email: value.email, ...("name" in value && typeof value.name === "string" ? { name: value.name } : {}) };
  } catch {
    return null;
  }
}
