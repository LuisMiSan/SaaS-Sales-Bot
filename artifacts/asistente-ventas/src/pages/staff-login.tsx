import { useState } from "react";
import { Lock } from "lucide-react";
import { login } from "@/lib/staff-auth";

interface Props {
  onLogin: () => void;
}

export default function StaffLogin({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const u = username.trim();
    const p = password;
    if (!u) { setError("Introduce tu usuario."); return; }
    if (!p) { setError("Introduce tu contraseña."); return; }
    setLoading(true);
    setError(null);
    const result = await login(u, p);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Error desconocido.");
      return;
    }
    onLogin();
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
            <label htmlFor="staff-username" className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
              Usuario
            </label>
            <input
              id="staff-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-white placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="staff-password" className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <input
              id="staff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
