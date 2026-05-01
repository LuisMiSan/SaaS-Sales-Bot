import { useEffect } from "react";
import { Link } from "wouter";

export default function CookiesPage() {
  useEffect(() => { document.documentElement.classList.remove("dark"); }, []);
  const year = new Date().getFullYear();

  return (
    <div className="bg-[#f5f7fa] min-h-screen font-jakarta">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            Pujamos<span className="text-[#EE7B22]">tu</span>coche.es
          </Link>
          <Link href="/" className="text-sm text-stone-500 hover:text-[#EE7B22]">← Volver</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-[#0A3D6E] mb-2">Política de Cookies</h1>
        <p className="text-sm text-stone-500 mb-10">Última actualización: enero de {year} · Conforme a la Directiva ePrivacy y el RGPD (UE) 2016/679</p>

        <div className="space-y-8 text-stone-700 text-sm leading-relaxed">

          <Section title="1. ¿Qué son las cookies?">
            <p>Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo cuando los visita. Permiten que el sitio recuerde sus preferencias y mejore su experiencia de navegación. Algunas cookies son imprescindibles para que el sitio funcione; otras son opcionales y requieren su consentimiento expreso según la normativa vigente.</p>
          </Section>

          <Section title="2. Cookies que utilizamos">
            <table className="w-full text-xs border border-stone-200 rounded-lg overflow-hidden">
              <thead className="bg-stone-100">
                <tr>
                  <th className="text-left p-3 font-semibold">Nombre</th>
                  <th className="text-left p-3 font-semibold">Tipo</th>
                  <th className="text-left p-3 font-semibold">Finalidad</th>
                  <th className="text-left p-3 font-semibold">Duración</th>
                  <th className="text-left p-3 font-semibold">Titular</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr className="bg-green-50">
                  <td className="p-3 font-mono">cookie_consent</td>
                  <td className="p-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">Necesaria</span></td>
                  <td className="p-3">Almacena sus preferencias de consentimiento de cookies</td>
                  <td className="p-3">13 meses</td>
                  <td className="p-3">Propia</td>
                </tr>
                <tr className="bg-green-50">
                  <td className="p-3 font-mono">fomo_start</td>
                  <td className="p-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">Necesaria</span></td>
                  <td className="p-3">Gestiona el temporizador de sesión de oportunidades (sessionStorage, no persiste)</td>
                  <td className="p-3">Sesión</td>
                  <td className="p-3">Propia</td>
                </tr>
                <tr className="bg-green-50">
                  <td className="p-3 font-mono">staff_api_key</td>
                  <td className="p-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">Necesaria</span></td>
                  <td className="p-3">Autenticación del panel de gestión interno (solo acceso staff)</td>
                  <td className="p-3">Sesión</td>
                  <td className="p-3">Propia</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono">_ga, _ga_*</td>
                  <td className="p-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">Analítica</span></td>
                  <td className="p-3">Google Analytics: mide el tráfico y el comportamiento de navegación de forma agregada y anónima</td>
                  <td className="p-3">13 meses</td>
                  <td className="p-3">Google LLC</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-stone-500 mt-2">Las cookies marcadas en verde son estrictamente necesarias y no requieren su consentimiento. Las demás solo se activan si usted las acepta.</p>
          </Section>

          <Section title="3. Cómo gestionar sus preferencias">
            <p>Puede aceptar, rechazar o personalizar las cookies no esenciales en cualquier momento a través del <strong>panel de preferencias de cookies</strong> que aparece al entrar en el sitio por primera vez, o haciendo clic en el enlace «Gestionar cookies» disponible en el pie de página.</p>
            <p className="mt-2">También puede configurar su navegador para bloquear o eliminar cookies. Tenga en cuenta que desactivar las cookies estrictamente necesarias puede afectar al funcionamiento del sitio.</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-stone-600">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#EE7B22] hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="text-[#EE7B22] hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#EE7B22] hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#EE7B22] hover:underline">Microsoft Edge</a></li>
            </ul>
          </Section>

          <Section title="4. Transferencias internacionales">
            <p>Las cookies analíticas de Google LLC implican una transferencia de datos a servidores en EE. UU. Esta transferencia se realiza al amparo de las Cláusulas Contractuales Tipo aprobadas por la Comisión Europea y las salvaguardas adicionales de Google.</p>
          </Section>

          <Section title="5. Actualizaciones de esta política">
            <p>Esta política puede actualizarse para reflejar cambios en las cookies que utilizamos o en la normativa aplicable. Le notificaremos cualquier cambio relevante mostrando de nuevo el panel de preferencias de cookies.</p>
          </Section>
        </div>
      </main>

      <footer className="bg-[#0A3D6E] text-white/50 py-6 px-6 text-center text-xs mt-12">
        <p>© {year} Pujamostucoche · <Link href="/privacidad" className="hover:text-white/80">Política de Privacidad</Link> · <Link href="/terminos" className="hover:text-white/80">Aviso Legal</Link></p>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-extrabold text-[#0A3D6E] mb-3 border-b border-stone-200 pb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
