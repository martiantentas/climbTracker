import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ascendiaLogo from '../assets/Ascendr.webp'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const C = {
  bg:     '#121212',
  bgAlt:  '#13161B',
  border: 'rgba(255,255,255,0.08)',
  accent: '#7F8BAD',
  txt:    '#EEEEEE',
  txtMid: '#8E8E8E',
  txtLow: '#5C5E62',
  font:   "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 44 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: C.txt, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.75, margin: '0 0 10px' }}>
      {children}
    </p>
  )
}

// ─── LEGAL NOTICE ─────────────────────────────────────────────────────────────

export default function LegalNoticePage({ lang }: { lang: Language }) {
  const navigate = useNavigate()
  const t = translations[lang]

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const L = {
    en: {
      title1: 'Legal ', title2: 'Notice',
      updated: 'Last updated: April 2026',
      labels: {
        tradingName: 'Trading name',
        owner: 'Owner',
        nif: 'NIF / CIF',
        address: 'Address',
        contactEmail: 'Contact email',
        registryData: 'Registry data',
      },
      sections: [
        '1. Identification of the Owner',
        '2. Purpose of the Website',
        '3. Intellectual and Industrial Property',
        '4. Limitation of Liability',
        '5. External Links',
        '6. Applicable Law and Jurisdiction',
        '7. Modifications',
      ],
      body: {
        s1intro: 'In compliance with Article 10 of Law 34/2002 of 11 July on Information Society Services and Electronic Commerce (LSSI-CE), the following information is provided about the owner of this website and service:',
        s1Values: [
          'Ascendr',
          "[Owner's full name or company name]",
          '[NIF or CIF]',
          '[Street, number, city, postal code, Spain]',
          '[contact@ascendia.app]',
          '[Mercantile Registry data if applicable]',
        ],
        s2p1: 'Ascendr is an online platform designed for the organisation and management of boulder climbing competitions. It allows competition organisers to create events, manage participants, configure scoring rules, and publish live and final results. Participants may register for competitions, log ascents, and view rankings via invite code.',
        s2p2: 'Access to the Ascendr platform requires the creation of a user account. Certain result pages are publicly accessible without an account.',
        s3p1: 'All content published on this website — including but not limited to text, images, graphics, logos, icons, software, source code, and the overall visual design — is the exclusive property of the owner of Ascendr or its licensors, and is protected by Spanish and EU intellectual property law.',
        s3p2: 'Reproduction, distribution, public communication, or transformation of any of this content, in whole or in part, for commercial purposes is expressly prohibited without the prior written consent of the owner.',
        s3p3: 'The Ascendr name and logo are trademarks of the owner. No licence or right to use them is granted without express written authorisation.',
        s4intro: 'Ascendr makes reasonable efforts to ensure the accuracy and availability of this service, but does not warrant uninterrupted or error-free operation. The owner shall not be liable for:',
        s4items: [
          'Temporary interruptions due to maintenance, technical failures, or third-party infrastructure outages.',
          "Loss or corruption of data caused by events beyond the owner's reasonable control.",
          'Inaccuracies in competition results entered by organisers or participants.',
          'Content or conduct of third parties who access the platform.',
        ],
        s5p1: 'This website may contain links to external websites operated by third parties. Ascendr has no control over such websites and accepts no responsibility for their content, privacy practices, or availability. The inclusion of a link does not imply any endorsement by Ascendr.',
        s6p1: 'These legal notices are governed by Spanish law, in particular Law 34/2002 (LSSI-CE) and any other applicable legislation. Any disputes arising from access to or use of this website shall be submitted to the courts of the owner\'s registered address, unless mandatory consumer protection rules designate another forum.',
        s7p1: 'The owner reserves the right to amend this Legal Notice at any time. Updated versions will be published on this page with a revised date. Continued use of the service following any changes constitutes acceptance of the updated notice.',
        footer: '© 2026 Ascendr · All rights reserved',
      },
    },
    es: {
      title1: 'Aviso ', title2: 'Legal',
      updated: 'Última actualización: abril de 2026',
      labels: {
        tradingName: 'Nombre comercial',
        owner: 'Titular',
        nif: 'NIF / CIF',
        address: 'Dirección',
        contactEmail: 'Correo de contacto',
        registryData: 'Datos del registro',
      },
      sections: [
        '1. Identificación del Titular',
        '2. Objeto del Sitio Web',
        '3. Propiedad Intelectual e Industrial',
        '4. Limitación de Responsabilidad',
        '5. Enlaces Externos',
        '6. Ley Aplicable y Jurisdicción',
        '7. Modificaciones',
      ],
      body: {
        s1intro: 'En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se facilita la siguiente información sobre el titular de este sitio web y servicio:',
        s1Values: [
          'Ascendr',
          '[Nombre completo o razón social del titular]',
          '[NIF o CIF]',
          '[Calle, número, ciudad, código postal, España]',
          '[contact@ascendia.app]',
          '[Datos del Registro Mercantil, si procede]',
        ],
        s2p1: 'Ascendr es una plataforma en línea diseñada para la organización y gestión de competiciones de escalada en boulder. Permite a los organizadores crear eventos, gestionar participantes, configurar reglas de puntuación y publicar resultados en tiempo real y finales. Los participantes pueden inscribirse en competiciones, registrar vías y consultar clasificaciones mediante un código de invitación.',
        s2p2: 'El acceso a la plataforma Ascendr requiere la creación de una cuenta de usuario. Determinadas páginas de resultados son accesibles públicamente sin necesidad de cuenta.',
        s3p1: 'Todos los contenidos publicados en este sitio web —incluyendo, entre otros, textos, imágenes, gráficos, logotipos, iconos, software, código fuente y el diseño visual en su conjunto— son propiedad exclusiva del titular de Ascendr o de sus licenciantes, y están protegidos por la legislación española y comunitaria en materia de propiedad intelectual.',
        s3p2: 'Queda expresamente prohibida la reproducción, distribución, comunicación pública o transformación de cualquiera de estos contenidos, en todo o en parte, con fines comerciales, sin el consentimiento previo y por escrito del titular.',
        s3p3: 'La denominación y el logotipo de Ascendr son marcas del titular. No se concede ninguna licencia ni derecho de uso sin autorización expresa y por escrito.',
        s4intro: 'Ascendr realiza esfuerzos razonables para garantizar la exactitud y disponibilidad del servicio, pero no garantiza un funcionamiento ininterrumpido ni exento de errores. El titular no será responsable de:',
        s4items: [
          'Interrupciones temporales debidas a mantenimiento, fallos técnicos o interrupciones de infraestructura de terceros.',
          'Pérdida o corrupción de datos causadas por circunstancias fuera del control razonable del titular.',
          'Inexactitudes en los resultados de competiciones introducidos por organizadores o participantes.',
          'El contenido o comportamiento de terceros que accedan a la plataforma.',
        ],
        s5p1: 'Este sitio web puede contener enlaces a sitios web externos gestionados por terceros. Ascendr no tiene control sobre dichos sitios y no acepta ninguna responsabilidad por su contenido, prácticas de privacidad o disponibilidad. La inclusión de un enlace no implica ningún tipo de respaldo por parte de Ascendr.',
        s6p1: 'Los presentes avisos legales se rigen por la legislación española, en particular por la Ley 34/2002 (LSSI-CE) y cualquier otra normativa aplicable. Cualquier controversia derivada del acceso o uso de este sitio web se someterá a los juzgados y tribunales del domicilio del titular, salvo que las normas imperativas de protección al consumidor designen otro fuero.',
        s7p1: 'El titular se reserva el derecho a modificar este Aviso Legal en cualquier momento. Las versiones actualizadas se publicarán en esta página con una fecha revisada. El uso continuado del servicio tras cualquier cambio constituye la aceptación del aviso actualizado.',
        footer: '© 2026 Ascendr · Todos los derechos reservados',
      },
    },
    ca: {
      title1: 'Avís ', title2: 'Legal',
      updated: 'Darrera actualització: abril de 2026',
      labels: {
        tradingName: 'Nom comercial',
        owner: 'Titular',
        nif: 'NIF / CIF',
        address: 'Adreça',
        contactEmail: 'Correu de contacte',
        registryData: 'Dades del registre',
      },
      sections: [
        '1. Identificació del Titular',
        '2. Objecte del Lloc Web',
        '3. Propietat Intel·lectual i Industrial',
        '4. Limitació de Responsabilitat',
        '5. Enllaços Externs',
        '6. Llei Aplicable i Jurisdicció',
        '7. Modificacions',
      ],
      body: {
        s1intro: "En compliment de l'article 10 de la Llei 34/2002, d'11 de juliol, de Serveis de la Societat de la Informació i de Comerç Electrònic (LSSI-CE), es facilita la informació següent sobre el titular d'aquest lloc web i servei:",
        s1Values: [
          'Ascendr',
          '[Nom complet o raó social del titular]',
          '[NIF o CIF]',
          '[Carrer, número, ciutat, codi postal, Espanya]',
          '[contact@ascendia.app]',
          '[Dades del Registre Mercantil, si escau]',
        ],
        s2p1: "Ascendr és una plataforma en línia dissenyada per a l'organització i la gestió de competicions d'escalada en boulder. Permet als organitzadors crear esdeveniments, gestionar participants, configurar regles de puntuació i publicar resultats en directe i finals. Els participants poden inscriure's en competicions, registrar vies i consultar classificacions mitjançant un codi d'invitació.",
        s2p2: "L'accés a la plataforma Ascendr requereix la creació d'un compte d'usuari. Determinades pàgines de resultats són accessibles públicament sense necessitat de compte.",
        s3p1: "Tots els continguts publicats en aquest lloc web —incloent-hi, entre d'altres, textos, imatges, gràfics, logotips, icones, programari, codi font i el disseny visual en el seu conjunt— són propietat exclusiva del titular d'Ascendr o dels seus llicenciants, i estan protegits per la legislació espanyola i comunitària en matèria de propietat intel·lectual.",
        s3p2: 'Queda expressament prohibida la reproducció, distribució, comunicació pública o transformació de qualsevol dels continguts, en tot o en part, amb finalitats comercials, sense el consentiment previ i per escrit del titular.',
        s3p3: "La denominació i el logotip d'Ascendr són marques del titular. No es concedeix cap llicència ni dret d'ús sense autorització expressa i per escrit.",
        s4intro: "Ascendr realitza esforços raonables per garantir l'exactitud i la disponibilitat del servei, però no garanteix un funcionament ininterromput ni lliure d'errors. El titular no serà responsable de:",
        s4items: [
          "Interrupcions temporals degudes a manteniment, fallades tècniques o interrupcions d'infraestructura de tercers.",
          'Pèrdua o corrupció de dades causades per circumstàncies fora del control raonable del titular.',
          "Inexactituds en els resultats de competicions introduïts per organitzadors o participants.",
          'El contingut o comportament de tercers que accedeixin a la plataforma.',
        ],
        s5p1: "Aquest lloc web pot contenir enllaços a llocs web externs gestionats per tercers. Ascendr no té control sobre aquests llocs i no accepta cap responsabilitat pel seu contingut, pràctiques de privacitat o disponibilitat. La inclusió d'un enllaç no implica cap mena de suport per part d'Ascendr.",
        s6p1: "Els presents avisos legals es regeixen per la legislació espanyola, en particular per la Llei 34/2002 (LSSI-CE) i qualsevol altra normativa aplicable. Qualsevol controvèrsia derivada de l'accés o l'ús d'aquest lloc web se sotmetrà als jutjats i tribunals del domicili del titular, llevat que les normes imperatives de protecció al consumidor designin un altre fur.",
        s7p1: 'El titular es reserva el dret a modificar aquest Avís Legal en qualsevol moment. Les versions actualitzades es publicaran en aquesta pàgina amb una data revisada. Els ús continuat del servei després de qualsevol canvi constitueix l\'acceptació de l\'avís actualitzat.',
        footer: '© 2026 Ascendr · Tots els drets reservats',
      },
    },
  }[lang]

  return (
    <div style={{ background: C.bg, color: C.txt, fontFamily: C.font, minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(18,18,18,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={ascendiaLogo} alt="Ascendr" width="120" height="120" style={{ height: 26, objectFit: 'contain' }} />
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.txtLow, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '6px 10px', borderRadius: 6, transition: 'color 0.33s' }}
            onMouseEnter={e => (e.currentTarget.style.color = C.txt)}
            onMouseLeave={e => (e.currentTarget.style.color = C.txtLow)}
          >
            <ArrowLeft size={14} /> {t.back}
          </button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '56px 24px 96px' }}>

        {/* Header */}
        <div style={{ marginBottom: 52, paddingBottom: 32, borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>Legal</p>
          <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.03em', color: C.txt, margin: '0 0 12px' }}>
            {L.title1}<span style={{ fontWeight: 700 }}>{L.title2}</span>
          </h1>
          <p style={{ fontSize: 13, color: C.txtLow, margin: 0 }}>{L.updated}</p>
        </div>

        {/* Identity */}
        <Section title={L.sections[0]}>
          <P>
            {L.body.s1intro}
          </P>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px', marginTop: 16, display: 'grid', rowGap: 12 }}>
            {([
              [L.labels.tradingName,  L.body.s1Values[0]],
              [L.labels.owner,        L.body.s1Values[1]],
              [L.labels.nif,          L.body.s1Values[2]],
              [L.labels.address,      L.body.s1Values[3]],
              [L.labels.contactEmail, L.body.s1Values[4]],
              [L.labels.registryData, L.body.s1Values[5]],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.txtLow, minWidth: 120 }}>{label}</span>
                <span style={{ fontSize: 13, color: value.startsWith('[') ? C.txtLow : C.txt }}>{value}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Purpose */}
        <Section title={L.sections[1]}>
          <P>
            {L.body.s2p1}
          </P>
          <P>
            {L.body.s2p2}
          </P>
        </Section>

        {/* Intellectual Property */}
        <Section title={L.sections[2]}>
          <P>
            {L.body.s3p1}
          </P>
          <P>
            {L.body.s3p2}
          </P>
          <P>
            {L.body.s3p3}
          </P>
        </Section>

        {/* Exclusion of liability */}
        <Section title={L.sections[3]}>
          <P>
            {L.body.s4intro}
          </P>
          <ul style={{ paddingLeft: 20, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {L.body.s4items.map(item => (
              <li key={item} style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
        </Section>

        {/* Links */}
        <Section title={L.sections[4]}>
          <P>
            {L.body.s5p1}
          </P>
        </Section>

        {/* Governing law */}
        <Section title={L.sections[5]}>
          <P>
            {L.body.s6p1}
          </P>
        </Section>

        {/* Modifications */}
        <Section title={L.sections[6]}>
          <P>
            {L.body.s7p1}
          </P>
        </Section>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: C.txtLow, margin: 0 }}>{L.body.footer}</p>
      </footer>
    </div>
  )
}
