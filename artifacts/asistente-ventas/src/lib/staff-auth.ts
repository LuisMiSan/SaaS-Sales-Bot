export async function checkSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/staff/session", { credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/staff/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.status === 401) return { ok: false, error: "Credenciales incorrectas. Inténtalo de nuevo." };
    if (res.status === 400) {
      const data = await res.json() as { error?: string };
      return { ok: false, error: data.error ?? "Datos incorrectos." };
    }
    if (!res.ok) return { ok: false, error: "Error del servidor. Inténtalo de nuevo." };
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/staff/logout", { method: "POST", credentials: "include" });
  } catch {
    // ignore
  }
}
