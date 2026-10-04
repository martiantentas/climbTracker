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
            In compliance with Article 10 of Law 34/2002 of 11 July on Information Society Services and Electronic Commerce (LSSI-CE), the following information is provided about the owner of this website and service:
          </P>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px', marginTop: 16, display: 'grid', rowGap: 12 }}>
            {([
              [L.labels.tradingName,   'Ascendr'],
              [L.labels.owner,         "[Owner's full name or company name]"],
              [L.labels.nif,           '[NIF or CIF]'],
              [L.labels.address,       '[Street, number, city, postal code, Spain]'],
              [L.labels.contactEmail,  '[contact@ascendia.app]'],
              [L.labels.registryData,  '[Mercantile Registry data if applicable]'],
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
            Ascendr is an online platform designed for the organisation and management of boulder climbing competitions. It allows competition organisers to create events, manage participants, configure scoring rules, and publish live and final results. Participants may register for competitions, log ascents, and view rankings via invite code.
          </P>
          <P>
            Access to the Ascendr platform requires the creation of a user account. Certain result pages are publicly accessible without an account.
          </P>
        </Section>

        {/* Intellectual Property */}
        <Section title={L.sections[2]}>
          <P>
            All content published on this website — including but not limited to text, images, graphics, logos, icons, software, source code, and the overall visual design — is the exclusive property of the owner of Ascendr or its licensors, and is protected by Spanish and EU intellectual property law.
          </P>
          <P>
            Reproduction, distribution, public communication, or transformation of any of this content, in whole or in part, for commercial purposes is expressly prohibited without the prior written consent of the owner.
          </P>
          <P>
            The Ascendr name and logo are trademarks of the owner. No licence or right to use them is granted without express written authorisation.
          </P>
        </Section>

        {/* Exclusion of liability */}
        <Section title={L.sections[3]}>
          <P>
            Ascendr makes reasonable efforts to ensure the accuracy and availability of this service, but does not warrant uninterrupted or error-free operation. The owner shall not be liable for:
          </P>
          <ul style={{ paddingLeft: 20, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Temporary interruptions due to maintenance, technical failures, or third-party infrastructure outages.',
              "Loss or corruption of data caused by events beyond the owner's reasonable control.",
              'Inaccuracies in competition results entered by organisers or participants.',
              'Content or conduct of third parties who access the platform.',
            ].map(item => (
              <li key={item} style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
        </Section>

        {/* Links */}
        <Section title={L.sections[4]}>
          <P>
            This website may contain links to external websites operated by third parties. Ascendr has no control over such websites and accepts no responsibility for their content, privacy practices, or availability. The inclusion of a link does not imply any endorsement by Ascendr.
          </P>
        </Section>

        {/* Governing law */}
        <Section title={L.sections[5]}>
          <P>
            These legal notices are governed by Spanish law, in particular Law 34/2002 (LSSI-CE) and any other applicable legislation. Any disputes arising from access to or use of this website shall be submitted to the courts of the owner's registered address, unless mandatory consumer protection rules designate another forum.
          </P>
        </Section>

        {/* Modifications */}
        <Section title={L.sections[6]}>
          <P>
            The owner reserves the right to amend this Legal Notice at any time. Updated versions will be published on this page with a revised date. Continued use of the service following any changes constitutes acceptance of the updated notice.
          </P>
        </Section>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: C.txtLow, margin: 0 }}>© 2026 Ascendr · All rights reserved</p>
      </footer>
    </div>
  )
}
