import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X, ChevronDown, ChevronUp } from "lucide-react";

type ConsentState = { necessary: true; analytics: boolean; marketing: boolean };

const CONSENT_KEY = "cookie_consent";

function loadConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

function saveConsent(c: ConsentState) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
  } catch {}
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = loadConsent();
    if (!stored) setVisible(true);
  }, []);

  function acceptAll() {
    saveConsent({ necessary: true, analytics: true, marketing: true });
    setVisible(false);
  }

  function rejectOptional() {
    saveConsent({ necessary: true, analytics: false, marketing: false });
    setVisible(false);
  }

  function saveCustom() {
    saveConsent({ necessary: true, analytics, marketing });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Preferencias de cookies"
      className="fixed bottom-0 inset-x-0 z-[9999] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0A3D6E]">Este sitio utiliza cookies</h2>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Usamos cookies propias y de terceros para mejorar tu experiencia. Las cookies estrictamente necesarias no pueden desactivarse. Puedes aceptar todas, rechazar las opcionales o personalizar tu elección.{" "}
                <Link href="/cookies" className="text-[#EE7B22] hover:underline">Más información</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Expandable preferences */}
        <div className="px-6">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#0A3D6E] py-3 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Gestionar preferencias
          </button>

          {expanded && (
            <div className="pb-4 space-y-3 text-xs">
              <CookieToggle
                label="Cookies estrictamente necesarias"
                description="Imprescindibles para el funcionamiento del sitio. No pueden desactivarse."
                checked={true}
                disabled
                onChange={() => {}}
              />
              <CookieToggle
                label="Cookies analíticas"
                description="Nos ayudan a entender cómo navegas por el sitio (Google Analytics). Datos anonimizados."
                checked={analytics}
                onChange={setAnalytics}
              />
              <CookieToggle
                label="Cookies de marketing"
                description="Permiten mostrarte anuncios relevantes en otras plataformas."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex flex-wrap gap-2 justify-end border-t border-stone-100 pt-4">
          <button
            type="button"
            onClick={rejectOptional}
            className="px-4 py-2 rounded-lg border border-stone-300 text-stone-600 text-xs font-semibold hover:bg-stone-50 transition-colors"
          >
            Solo necesarias
          </button>
          {expanded && (
            <button
              type="button"
              onClick={saveCustom}
              className="px-4 py-2 rounded-lg border border-[#0A3D6E] text-[#0A3D6E] text-xs font-semibold hover:bg-[#0A3D6E]/5 transition-colors"
            >
              Guardar preferencias
            </button>
          )}
          <button
            type="button"
            onClick={acceptAll}
            className="px-4 py-2 rounded-lg bg-[#EE7B22] hover:bg-[#C4621A] text-white text-xs font-extrabold transition-colors"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}

function CookieToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-stone-100 last:border-0">
      <div className="flex-1">
        <div className="font-semibold text-stone-700">{label}</div>
        <div className="text-stone-500 mt-0.5">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative shrink-0 h-5 w-9 rounded-full transition-colors mt-0.5 ${
          checked ? "bg-[#EE7B22]" : "bg-stone-300"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
