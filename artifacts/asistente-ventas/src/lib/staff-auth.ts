const SESSION_KEY = "staff_api_key";

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, token);
  } catch {
    // ignore
  }
}

export function clearStoredToken(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredToken());
}
