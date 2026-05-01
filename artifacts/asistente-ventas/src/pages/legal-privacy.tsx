import { useEffect } from "react";
import { Link } from "wouter";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-extrabold text-[#0A3D6E] mb-2">Política de Privacidad</h1>
        <p className="text-sm text-stone-500 mb-10">Última actualización: enero de {year} · Conforme al RGPD (UE) 2016/679 y la LOPDGDD</p>

        <div className="prose prose-stone max-w-none space-y-8 text-stone-700 text-sm leading-relaxed">

          <Section title="1. Responsable del tratamiento">
            <p><strong>Identidad:</strong> Pujamostucoche (en adelante, «el Responsable»)</p>
            <p><strong>Correo electrónico:</strong> <a href="mailto:pujamostucoche@gmail.com" className="text-[#EE7B22]">pujamostucoche@gmail.com</a></p>
            <p><strong>Dominio:</strong> pujamostucoche.es</p>
          </Section>

          <Section title="2. Datos que recabamos y finalidades">
            <table className="w-full text-xs border border-stone-200 rounded-lg overflow-hidden">
              <thead className="bg-stone-100">
                <tr>
                  <th className="text-left p-3 font-semibold">Dato</th>
                  <th className="text-left p-3 font-semibold">Finalidad</th>
                  <th className="text-left p-3 font-semibold">Base legal</th>
                  <th className="text-left p-3 font-semibold">Plazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr><td className="p-3">Nombre y teléfono (WhatsApp)</td><td className="p-3">Gestión del proceso de compra y atención comercial</td><td className="p-3">Ejecución de relación precontractual (art. 6.1.b RGPD)</td><td className="p-3">Durante la negociación y 3 años tras su cierre</td></tr>
                <tr><td className="p-3">Datos de navegación y cookies analíticas</td><td className="p-3">Mejora del servicio y estadísticas anónimas</td><td className="p-3">Consentimiento (art. 6.1.a RGPD)</td><td className="p-3">13 meses desde la recogida</td></tr>
                <tr><td className="p-3">Dirección IP</td><td className="p-3">Seguridad, detección de abuso y cumplimiento legal</td><td className="p-3">Interés legítimo (art. 6.1.f RGPD)</td><td className="p-3">90 días</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="3. Destinatarios y transferencias internacionales">
            <p>Sus datos no se ceden a terceros salvo obligación legal. Los prestadores de servicios técnicos (alojamiento en servidores de Replit Inc., EE. UU.) han firmado las Cláusulas Contractuales Tipo de la Comisión Europea, garantizando un nivel de protección equivalente al exigido en la UE.</p>
          </Section>

          <Section title="4. Derechos de los interesados">
            <p>Puede ejercer en cualquier momento sus derechos de <strong>acceso, rectificación, supresión, limitación, portabilidad y oposición</strong> enviando un correo a <a href="mailto:pujamostucoche@gmail.com" className="text-[#EE7B22]">pujamostucoche@gmail.com</a> con el asunto «Protección de datos» adjuntando copia de su DNI.</p>
            <p className="mt-2">Tiene también derecho a presentar una reclamación ante la <strong>Agencia Española de Protección de Datos</strong> (aepd.es) si considera que el tratamiento no se ajusta a la normativa.</p>
          </Section>

          <Section title="5. Seguridad">
            <p>Aplicamos medidas técnicas y organizativas adecuadas (cifrado TLS, control de acceso por clave, minimización de datos) para garantizar un nivel de seguridad apropiado al riesgo, conforme al art. 32 RGPD.</p>
          </Section>

          <Section title="6. Modificaciones">
            <p>Esta política puede actualizarse para reflejar cambios legales o en el servicio. La versión vigente estará siempre disponible en esta página con la fecha de última actualización.</p>
          </Section>
        </div>
      </main>

      <footer className="bg-[#0A3D6E] text-white/50 py-6 px-6 text-center text-xs mt-12">
        <p>© {year} Pujamostucoche · <Link href="/cookies" className="hover:text-white/80">Política de Cookies</Link> · <Link href="/terminos" className="hover:text-white/80">Aviso Legal</Link></p>
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
