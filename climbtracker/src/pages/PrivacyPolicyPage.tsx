import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ascendiaLogo from '../assets/Ascendia.png'

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const C = {
  bg:     '#121212',
  bgAlt:  '#13161B',
  border: 'rgba(255,255,255,0.08)',
  accent: '#3E6AE1',
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

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.txtLow, minWidth: 140 }}>{label}</span>
      <span style={{ fontSize: 13, color: value.startsWith('[') ? C.txtLow : C.txt }}>{value}</span>
    </div>
  )
}

// ─── PRIVACY POLICY ───────────────────────────────────────────────────────────

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div style={{ background: C.bg, color: C.txt, fontFamily: C.font, minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(18,18,18,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={ascendiaLogo} alt="Ascendia" style={{ height: 26, objectFit: 'contain' }} />
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.txtLow, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '6px 10px', borderRadius: 6, transition: 'color 0.33s' }}
            onMouseEnter={e => (e.currentTarget.style.color = C.txt)}
            onMouseLeave={e => (e.currentTarget.style.color = C.txtLow)}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '56px 24px 96px' }}>

        {/* Header */}
        <div style={{ marginBottom: 52, paddingBottom: 32, borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>Legal</p>
          <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.03em', color: C.txt, margin: '0 0 12px' }}>
            Privacy <span style={{ fontWeight: 700 }}>Policy</span>
          </h1>
          <p style={{ fontSize: 13, color: C.txtLow, margin: 0 }}>Last updated: April 2026</p>
        </div>

        {/* Intro */}
        <Section title="1. Data Controller">
          <P>
            Ascendia collects and processes personal data in its capacity as data controller within the meaning of the General Data Protection Regulation (EU) 2016/679 (GDPR) and Organic Law 3/2018 of 5 December on the Protection of Personal Data and Guarantee of Digital Rights (LOPDGDD).
          </P>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px', marginTop: 16, display: 'grid', rowGap: 12 }}>
            <InfoChip label="Trading name"  value="Ascendia" />
            <InfoChip label="Owner"         value={"[Owner's full name or company name]"} />
            <InfoChip label="NIF / CIF"     value="[NIF or CIF]" />
            <InfoChip label="Address"       value="[Street, number, city, postal code, Spain]" />
            <InfoChip label="Contact email" value="[contact@ascendia.app]" />
          </div>
        </Section>

        {/* What we collect */}
        <Section title="2. Personal Data We Collect">
          <P>
            We collect only the data that is necessary to provide the Ascendia service. Depending on how you use the platform, this may include:
          </P>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {([
              ['Account data',      'Display name, email address, and chosen gender. These are provided by you when you create an account.'],
              ['Competition data',  'Categories, BIB numbers, scores (tops, zones, attempts), timestamps of logged ascents, and per-competition traits assigned by organisers.'],
              ['Profile data',      'An optional emoji avatar chosen by the user. No profile photos or biometric data are processed.'],
              ['Usage session data','Standard web server logs (IP address, browser type, pages visited) retained briefly for security and debugging. No cross-site tracking is performed.'],
            ] as [string, string][]).map(([label, desc]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, margin: '0 0 4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ fontSize: 13, color: C.txtMid, lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* No cookies */}
        <Section title="3. Cookies and Tracking Technologies">
          <P>
            <strong style={{ color: C.txt }}>Ascendia does not use third-party cookies, advertising trackers, or cross-site analytics tools.</strong> We do not share browsing data with any advertising or data brokerage networks.
          </P>
          <P>
            The platform may use browser <em>localStorage</em> to store user preferences (such as language selection) locally on your device. This data never leaves your browser and is not transmitted to our servers.
          </P>
          <P>
            Session authentication uses technically necessary mechanisms (such as session tokens). These are essential for the service to function and do not require consent under applicable law.
          </P>
        </Section>

        {/* Purposes */}
        <Section title="4. Purposes and Legal Basis for Processing">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {([
              ['Account management & service delivery', 'To create and maintain your user account and provide access to the Ascendia platform.', 'Performance of contract — Art. 6(1)(b) GDPR'],
              ['Competition participation',             'To register you in competitions, assign BIB numbers, record scores, and display your results on rankings.', 'Performance of contract — Art. 6(1)(b) GDPR'],
              ['Public leaderboards',                   'Competition results (name, BIB, score) may be displayed on public results pages linked by the competition organiser.', 'Legitimate interest — Art. 6(1)(f) GDPR'],
              ['Security & abuse prevention',          'Server logs and session data are processed to detect and prevent unauthorised access.', 'Legitimate interest — Art. 6(1)(f) GDPR'],
              ['Legal compliance',                     'We retain data as required by applicable tax and legal obligations.', 'Legal obligation — Art. 6(1)(c) GDPR'],
            ] as [string, string, string][]).map(([purpose, desc, basis]) => (
              <div key={purpose} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.txt, margin: '0 0 4px' }}>{purpose}</p>
                <p style={{ fontSize: 13, color: C.txtMid, lineHeight: 1.65, margin: '0 0 6px' }}>{desc}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.accent, margin: 0 }}>{basis}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Retention */}
        <Section title="5. Data Retention">
          <P>
            We retain your personal data only for as long as it is necessary for the purposes described above:
          </P>
          <ul style={{ paddingLeft: 20, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Account data is kept for as long as your account is active. If you request account deletion, your data will be removed within 30 days, unless retention is required by law.',
              'Competition result data (scores, rankings) may be retained in anonymised or aggregated form beyond account deletion for statistical and historical purposes.',
              'Server logs are retained for a maximum of 90 days for security purposes.',
            ].map(item => (
              <li key={item} style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
        </Section>

        {/* Recipients */}
        <Section title="6. Data Recipients and International Transfers">
          <P>
            Ascendia does not sell your personal data to third parties. Your data may be shared only with:
          </P>
          <ul style={{ paddingLeft: 20, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Hosting and infrastructure providers that process data on our behalf under appropriate data processing agreements.',
              'Payment processors for the processing of competition fees (payment data is handled directly by the payment provider and is not stored by Ascendia).',
              'Public authorities, when required by law.',
            ].map(item => (
              <li key={item} style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
          <P>
            Any transfers outside the European Economic Area are made under appropriate safeguards in accordance with Chapter V of the GDPR.
          </P>
        </Section>

        {/* Rights */}
        <Section title="7. Your Rights">
          <P>
            Under the GDPR and the LOPDGDD, you have the following rights regarding your personal data:
          </P>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 8 }}>
            {([
              ['Access',          'Request a copy of the data we hold about you.'],
              ['Rectification',   'Ask us to correct inaccurate or incomplete data.'],
              ['Erasure',         'Request deletion of your data ("right to be forgotten").'],
              ['Restriction',     'Ask us to restrict how we process your data in certain circumstances.'],
              ['Portability',     'Receive your data in a structured, machine-readable format.'],
              ['Objection',       'Object to processing based on legitimate interest.'],
              ['Withdraw consent','Where processing is based on consent, withdraw it at any time without affecting prior processing.'],
            ] as [string, string][]).map(([right, desc]) => (
              <div key={right} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{right}</p>
                <p style={{ fontSize: 12, color: C.txtMid, lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.75, margin: '16px 0 0' }}>
            To exercise any of these rights, contact us at <span style={{ color: C.accent }}>[contact@ascendia.app]</span>. We will respond within 30 days. You also have the right to lodge a complaint with the Spanish Data Protection Authority (AEPD) at{' '}
            <span style={{ color: C.accent }}>www.aepd.es</span>.
          </p>
        </Section>

        {/* Minors */}
        <Section title="8. Minors">
          <P>
            The Ascendia platform is not directed at children under 14 years of age. We do not knowingly collect personal data from children under 14. If you believe a minor has provided us with personal data without appropriate consent, please contact us so we can delete it promptly.
          </P>
        </Section>

        {/* Changes */}
        <Section title="9. Changes to this Policy">
          <P>
            We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. We encourage you to review this policy periodically. Material changes will be communicated to registered users via email or an in-app notice.
          </P>
        </Section>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: C.txtLow, margin: 0 }}>© 2026 Ascendia · All rights reserved</p>
      </footer>
    </div>
  )
}
