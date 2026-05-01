import { useEffect } from "react";
import { Link } from "wouter";

export default function TermsPage() {
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
        <h1 className="text-3xl font-extrabold text-[#0A3D6E] mb-2">Aviso Legal y Condiciones de Uso</h1>
        <p className="text-sm text-stone-500 mb-10">Última actualización: enero de {year} · Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI) y normativa española aplicable</p>

        <div className="space-y-8 text-stone-700 text-sm leading-relaxed">

          <Section title="1. Datos identificativos del titular">
            <p><strong>Denominación:</strong> Pujamostucoche</p>
            <p><strong>Actividad:</strong> Intermediación y venta de vehículos de ocasión</p>
            <p><strong>Domicilio:</strong> Madrid, España</p>
            <p><strong>Correo de contacto:</strong> <a href="mailto:pujamostucoche@gmail.com" className="text-[#EE7B22]">pujamostucoche@gmail.com</a></p>
          </Section>

          <Section title="2. Objeto y ámbito de aplicación">
            <p>El presente aviso legal regula el acceso, navegación y uso del sitio web <strong>pujamostucoche.es</strong> (en adelante, «el Sitio»). El mero acceso al Sitio atribuye la condición de usuario e implica la aceptación plena y sin reservas de estas condiciones.</p>
          </Section>

          <Section title="3. Descripción del servicio">
            <p>Pujamostucoche ofrece un servicio de <strong>outlet flash de vehículos de ocasión</strong> mediante el cual el usuario puede:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Visualizar el catálogo de vehículos disponibles.</li>
              <li>Bloquear una unidad durante un máximo de <strong>2 horas</strong> sin coste ni compromiso de compra.</li>
              <li>Contactar con un comercial a través de WhatsApp para resolver dudas o formalizar la compra.</li>
            </ul>
            <p className="mt-2">El bloqueo de una unidad no supone reserva firme ni genera obligación de compra para ninguna de las partes. Transcurridas 2 horas sin que se formalice la operación, la unidad queda automáticamente disponible para otros usuarios.</p>
          </Section>

          <Section title="4. Propiedad intelectual e industrial">
            <p>Todos los contenidos del Sitio (textos, imágenes, logotipos, diseño gráfico, código fuente) son titularidad de Pujamostucoche o de sus licenciantes, y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o comunicación pública sin autorización expresa.</p>
          </Section>

          <Section title="5. Exclusión de garantías y responsabilidad">
            <p>Pujamostucoche no garantiza la disponibilidad continua del Sitio ni la ausencia de errores en los contenidos. Las fotografías e información de los vehículos son orientativas; las características definitivas se confirman en el momento de la visita física o la documentación contractual.</p>
            <p className="mt-2">Pujamostucoche no será responsable de los daños derivados del uso indebido del Sitio, de la interrupción del servicio por causas ajenas a su control o de los actos de terceros.</p>
          </Section>

          <Section title="6. Menores de edad">
            <p>El Sitio está dirigido a mayores de 18 años. Los menores de edad deben obtener el consentimiento de sus padres o tutores legales antes de facilitar cualquier dato personal.</p>
          </Section>

          <Section title="7. Legislación aplicable y jurisdicción">
            <p>Las presentes condiciones se rigen por la legislación española. Para la resolución de cualquier controversia derivada del acceso o uso del Sitio, las partes se someten a los Juzgados y Tribunales de <strong>Madrid</strong>, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.</p>
          </Section>

          <Section title="8. Modificaciones">
            <p>Pujamostucoche se reserva el derecho a modificar estas condiciones en cualquier momento. Las modificaciones entrarán en vigor desde su publicación en el Sitio. Se recomienda revisar periódicamente esta página.</p>
          </Section>
        </div>
      </main>

      <footer className="bg-[#0A3D6E] text-white/50 py-6 px-6 text-center text-xs mt-12">
        <p>© {year} Pujamostucoche · <Link href="/privacidad" className="hover:text-white/80">Política de Privacidad</Link> · <Link href="/cookies" className="hover:text-white/80">Política de Cookies</Link></p>
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
