import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ascendiaLogo from '../assets/Ascendia.png'
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

// ─── TERMS PAGE ───────────────────────────────────────────────────────────────

export default function TermsPage({ lang }: { lang: Language }) {
  const navigate = useNavigate()
  const t = translations[lang]

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
            Terms & <span style={{ fontWeight: 700 }}>Conditions</span>
          </h1>
          <p style={{ fontSize: 13, color: C.txtLow, margin: 0 }}>Last updated: April 2026</p>
        </div>

        {/* Acceptance */}
        <Section title="1. Acceptance of Terms">
          <P>
            By accessing or using the Ascendia platform — including creating a user account, participating in a competition, or purchasing a plan as an organiser — you agree to be bound by these Terms and Conditions, together with the Privacy Policy and Legal Notice published on this site.
          </P>
          <P>
            If you do not agree with any part of these Terms, you must not use the Ascendia service. These Terms apply to all users, including competition organisers, judges, and participants.
          </P>
        </Section>

        {/* Service description */}
        <Section title="2. Service Description">
          <P>
            Ascendia is a Software-as-a-Service (SaaS) platform for the organisation and management of boulder climbing competitions. The platform enables:
          </P>
          <ul style={{ paddingLeft: 20, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Competition organisers to create events, configure boulders and scoring rules, manage participants and judges, and publish live and final results.',
              'Judges to validate tops and zones in real time using the Judging Panel.',
              'Participants to register via invite code, log their own ascents (where enabled by the organiser), and follow the live leaderboard.',
              'Public visitors to view results on competition result pages without creating an account.',
            ].map(item => (
              <li key={item} style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
          <P>
            Ascendia is provided on an "as-is" basis. We reserve the right to modify, suspend, or discontinue any part of the service at any time, with reasonable notice where possible.
          </P>
        </Section>

        {/* Account registration */}
        <Section title="3. Account Registration">
          <P>
            To use Ascendia, you must register an account by providing a valid email address, a display name, and creating a password. You warrant that:
          </P>
          <ul style={{ paddingLeft: 20, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'The information you provide is accurate, current, and complete.',
              'You are at least 14 years of age, or that your parent or guardian has provided consent where required by applicable law.',
              'You will maintain the confidentiality of your login credentials and are responsible for all activity under your account.',
              'You will notify us immediately of any unauthorised use of your account.',
            ].map(item => (
              <li key={item} style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
          <P>
            We reserve the right to suspend or terminate accounts that violate these Terms.
          </P>
        </Section>

        {/* Organiser responsibilities */}
        <Section title="4. Organiser Responsibilities">
          <P>
            Users who create and manage competitions ("Organisers") take on additional responsibilities:
          </P>
          <ul style={{ paddingLeft: 20, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Organisers are solely responsible for the accuracy of competition configuration, including boulder grades, scoring rules, and participant data.',
              'Organisers must obtain any necessary consents from participants before entering their personal data (name, gender, category) into the platform.',
              'Organisers are responsible for communicating to participants how their data will be used, including publication of results on public leaderboard pages.',
              'Organisers must comply with all applicable sporting federation rules, safety regulations, and local law when running events.',
              'Ascendia is a software tool — it does not assume liability for decisions made by organisers or the conduct of events.',
            ].map(item => (
              <li key={item} style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
        </Section>

        {/* Pricing */}
        <Section title="5. Plans, Pricing, and Payment">
          <P>
            Ascendia is offered on a per-event subscription basis. Published prices are in euros (€) and include applicable VAT.
          </P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
            {([
              ['Standard — €99 / event', 'Up to 300 participants. Includes live leaderboard, flexible scoring, analytics, judge and self-scoring modes, and extra capacity bundles at €0.12 per participant above 300.'],
              ['Premium — €199 / event', 'Up to 500 participants. Includes all Standard features plus white-label logo, custom accent colour, and branded theme colours. Overage at €0.10 per participant above 500.'],
            ] as [string, string][]).map(([plan, desc]) => (
              <div key={plan} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.txt, margin: '0 0 5px' }}>{plan}</p>
                <p style={{ fontSize: 13, color: C.txtMid, lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
          <P>
            Payment is due before a competition is set to Live status. Ascendia uses a third-party payment processor; by completing a payment you also agree to that processor's terms. Ascendia does not store full payment card details.
          </P>
          <P>
            <strong style={{ color: C.txt }}>Refund policy:</strong> Competition plans are non-refundable once the competition has been published (status set to Live). If you encounter a technical issue that prevents the service from functioning as described, contact us within 7 days and we will investigate and offer a remedy at our discretion.
          </P>
        </Section>

        {/* Acceptable use */}
        <Section title="6. Acceptable Use">
          <P>
            You agree not to use Ascendia to:
          </P>
          <ul style={{ paddingLeft: 20, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Violate any applicable law or regulation.',
              'Submit false, misleading, or fraudulent competition scores or participant data.',
              'Attempt to gain unauthorised access to the platform, other user accounts, or our infrastructure.',
              'Introduce malware, viruses, or any code designed to disrupt or damage the service.',
              'Scrape or harvest data from the platform in an automated manner without our written consent.',
              'Use the service to harass, defame, or harm any individual.',
              'Reverse-engineer, decompile, or attempt to extract the source code of Ascendia.',
            ].map(item => (
              <li key={item} style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
          <P>
            Violations may result in immediate account suspension and, where applicable, legal action.
          </P>
        </Section>

        {/* IP */}
        <Section title="7. Intellectual Property">
          <P>
            All intellectual property rights in the Ascendia platform — including the software, design, logos, and documentation — are and remain the property of the owner. These Terms do not grant you any rights other than a limited, non-exclusive, non-transferable licence to use the service for its intended purpose during the term of your subscription.
          </P>
          <P>
            Content created by users (such as competition names, boulder descriptions, and result data) remains the property of the respective user or organiser. By posting content on the platform, you grant Ascendia a worldwide, royalty-free licence to host, reproduce, and display that content solely for the purpose of operating the service.
          </P>
        </Section>

        {/* Limitation of liability */}
        <Section title="8. Limitation of Liability">
          <P>
            To the maximum extent permitted by law, Ascendia shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the service.
          </P>
          <P>
            Our total aggregate liability to you in respect of any claims under or in connection with these Terms shall not exceed the amount paid by you for the competition plan giving rise to the claim in the twelve months preceding the claim.
          </P>
          <P>
            Nothing in these Terms limits liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded or limited under applicable law.
          </P>
        </Section>

        {/* Termination */}
        <Section title="9. Termination">
          <P>
            You may delete your account at any time via the account settings. On deletion, your personal data will be removed in accordance with our Privacy Policy.
          </P>
          <P>
            We may suspend or terminate your account immediately if you breach these Terms, if we reasonably suspect fraudulent or harmful activity, or if we are required to do so by law. Where feasible, we will give prior notice of termination.
          </P>
          <P>
            Termination of your account does not entitle you to a refund of any fees already paid for a live or completed competition.
          </P>
        </Section>

        {/* Governing law */}
        <Section title="10. Governing Law and Dispute Resolution">
          <P>
            These Terms and Conditions are governed by Spanish law. In particular, they are subject to the General Law for the Defence of Consumers and Users (Real Decreto Legislativo 1/2007) in relation to B2C transactions.
          </P>
          <P>
            Any dispute arising from or in connection with these Terms shall first be attempted to be resolved amicably. If no resolution is reached within 30 days, disputes shall be submitted to the courts of the owner's registered address, unless mandatory consumer protection law designates another competent court.
          </P>
          <P>
            EU residents may also use the European Commission's Online Dispute Resolution platform at{' '}
            <span style={{ color: C.accent }}>ec.europa.eu/consumers/odr</span>.
          </P>
        </Section>

        {/* Changes */}
        <Section title="11. Changes to These Terms">
          <P>
            We may update these Terms at any time. Material changes will be notified to registered users via email or an in-app message at least 14 days before they take effect. Continued use of the service after the effective date constitutes acceptance of the updated Terms.
          </P>
          <P>
            The current version of the Terms is always available at this URL. We recommend you save or print a copy for your records.
          </P>
        </Section>

        {/* Contact */}
        <Section title="12. Contact">
          <P>
            For any questions regarding these Terms, please contact us at{' '}
            <span style={{ color: C.accent }}>[contact@ascendia.app]</span>.
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
