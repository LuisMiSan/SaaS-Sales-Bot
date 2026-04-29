import { useState } from "react";
import { Lock } from "lucide-react";
import { setStoredToken } from "@/lib/staff-auth";

interface Props {
  onLogin: () => void;
}

export default function StaffLogin({ onLogin }: Props) {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Introduce la clave de acceso.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/summary", {
        headers: { Authorization: `Bearer ${trimmed}` },
      });
      if (res.status === 401) {
        setError("Clave incorrecta. Inténtalo de nuevo.");
        return;
      }
      if (!res.ok && res.status !== 200) {
        setError("Clave incorrecta. Inténtalo de nuevo.");
        return;
      }
      setStoredToken(trimmed);
      onLogin();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-stone-800 mb-4">
            <Lock className="h-7 w-7 text-stone-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Panel comercial</h1>
          <p className="text-stone-400 text-sm mt-1">Acceso solo para el equipo interno</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="staff-key" className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
              Clave de acceso
            </label>
            <input
              id="staff-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="••••••••••••••••"
              autoComplete="current-password"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-white placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm font-medium">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-stone-700 disabled:text-stone-400 text-white font-extrabold py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
