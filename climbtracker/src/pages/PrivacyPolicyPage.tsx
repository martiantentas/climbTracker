import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ascendiaLogo from '../assets/Ascendr.webp'
import type { Language } from '../translations'
import { translations } from '../translations'
import { openCookiePreferences } from '../components/CookieBanner'

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

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.txtLow, minWidth: 140 }}>{label}</span>
      <span style={{ fontSize: 13, color: value.startsWith('[') ? C.txtLow : C.txt }}>{value}</span>
    </div>
  )
}

// ─── PRIVACY POLICY ───────────────────────────────────────────────────────────

export default function PrivacyPolicyPage({ lang }: { lang: Language }) {
  const navigate = useNavigate()
  const t = translations[lang]

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const L = {
    en: {
      title1: 'Privacy ', title2: 'Policy',
      updated: 'Last updated: September 2026',
      cookieBtn: 'Manage cookie preferences',
      chipLabels: { tradingName: 'Trading name', address: 'Address' },
      sections: [
        '1. Data Controller',
        '2. Personal Data We Collect',
        '3. Cookies and Tracking Technologies',
        '4. Purposes and Legal Basis for Processing',
        '5. Data Retention',
        '6. Data Recipients and International Transfers',
        '7. Your Rights',
        '8. Minors',
        '9. Changes to this Policy',
      ],
      body: {
        chipValues: { tradingName: 'Ascendr', address: 'Barcelona, Spain' },
        s1intro: 'Ascendr collects and processes personal data in its capacity as data controller within the meaning of the General Data Protection Regulation (EU) 2016/679 (GDPR) and Organic Law 3/2018 of 5 December on the Protection of Personal Data and Guarantee of Digital Rights (LOPDGDD).',
        s2intro: 'We collect only the data that is necessary to provide the Ascendr service. Depending on how you use the platform, this may include:',
        s2categories: [
          ['Account data',       'Display name, email address, and chosen gender. These are provided by you when you create an account.'],
          ['Competition data',   'Categories, BIB numbers, scores (tops, zones, attempts), timestamps of logged ascents, and per-competition traits assigned by organisers.'],
          ['Profile data',       'An optional emoji avatar chosen by the user. No profile photos or biometric data are processed.'],
          ['Usage session data', 'Standard web server logs (IP address, browser type, pages visited) retained briefly for security and debugging. No cross-site tracking is performed.'],
        ] as [string, string][],
        s3intro: 'Ascendr uses a limited set of cookies and local storage entries. We do not use advertising cookies or share browsing data with data brokers.',
        s3essentialHeading: 'Technically necessary (no consent required)',
        s3essentialCookies: [
          ['Session token',         'Supabase',  'Keeps you logged in. Stored in localStorage.',                        'Session duration'],
          ['Language preference',   'Ascendr',   'Stores your chosen language (EN/ES/CA) in localStorage.',             'Persistent'],
          ['Cookie consent choice', 'Ascendr',   'Stores whether you accepted or rejected analytics cookies.',          '1 year'],
        ] as [string, string, string, string][],
        s3analyticsHeading: 'Analytics cookies (consent required)',
        s3analyticsBefore: 'With your consent, Ascendr uses ',
        s3analyticsAfter: ' (via Google Tag Manager) to understand how visitors use the site and to improve it. No advertising or cross-site profiling is performed.',
        s3analyticsCookies: [
          ['_ga',             'Google Analytics', 'Identifies unique users across sessions.',      '2 years'],
          ['_ga_SL24MGJ1ZX',  'Google Analytics', 'Stores and counts page-view sessions.',         '2 years'],
        ] as [string, string, string, string][],
        s3gdprPara: "Data collected by Google Analytics is processed by Google LLC (USA) under the EU–US Data Privacy Framework. For more information see",
        s3gdprLinkText: "Google's Privacy Policy",
        s4purposes: [
          ['Account management & service delivery', 'To create and maintain your user account and provide access to the Ascendr platform.',                                                                                                                          'Performance of contract — Art. 6(1)(b) GDPR'],
          ['Competition participation',             'To register you in competitions, assign BIB numbers, record scores, and display your results on rankings.',                                                                                                    'Performance of contract — Art. 6(1)(b) GDPR'],
          ['Public leaderboards',                   'Competition results (name, BIB, score) may be displayed on public results pages linked by the competition organiser.',                                                                                         'Legitimate interest — Art. 6(1)(f) GDPR'],
          ['Analytics (with consent)',              'We use Google Analytics 4 to understand how the site is used and to improve the product. Analytics cookies are only set after you give explicit consent via the cookie banner.',                               'Consent — Art. 6(1)(a) GDPR'],
          ['Security & abuse prevention',           'Server logs and session data are processed to detect and prevent unauthorised access.',                                                                                                                        'Legitimate interest — Art. 6(1)(f) GDPR'],
          ['Legal compliance',                      'We retain data as required by applicable tax and legal obligations.',                                                                                                                                          'Legal obligation — Art. 6(1)(c) GDPR'],
        ] as [string, string, string][],
        s5intro: 'We retain your personal data only for as long as it is necessary for the purposes described above:',
        s5items: [
          'Account data is kept for as long as your account is active. If you request account deletion, your data will be removed within 30 days, unless retention is required by law.',
          'Competition result data (scores, rankings) may be retained in anonymised or aggregated form beyond account deletion for statistical and historical purposes.',
          'Server logs are retained for a maximum of 90 days for security purposes.',
        ],
        s6intro: 'Ascendr does not sell your personal data to third parties. Your data may be shared only with:',
        s6items: [
          'Hosting and infrastructure providers (Supabase, Vercel) that process data on our behalf under appropriate data processing agreements.',
          'Google LLC — for analytics via Google Analytics 4 and Google Tag Manager, only when you have given consent. Data may be processed in the USA under the EU–US Data Privacy Framework.',
          'Payment processors (Stripe) for the processing of competition fees. Payment data is handled directly by the payment provider and is not stored by Ascendr.',
          'Public authorities, when required by law.',
        ],
        s6p2: 'Any transfers outside the European Economic Area are made under appropriate safeguards in accordance with Chapter V of the GDPR.',
        s7intro: 'Under the GDPR and the LOPDGDD, you have the following rights regarding your personal data:',
        s7rights: [
          ['Access',           'Request a copy of the data we hold about you.'],
          ['Rectification',    'Ask us to correct inaccurate or incomplete data.'],
          ['Erasure',          'Request deletion of your data ("right to be forgotten").'],
          ['Restriction',      'Ask us to restrict how we process your data in certain circumstances.'],
          ['Portability',      'Receive your data in a structured, machine-readable format.'],
          ['Objection',        'Object to processing based on legitimate interest.'],
          ['Withdraw consent', 'Where processing is based on consent, withdraw it at any time without affecting prior processing.'],
        ] as [string, string][],
        s7exercise: 'To exercise any of these rights, use the account settings within the Ascendr application or contact us via the in-app support channel. We will respond within 30 days. You also have the right to lodge a complaint with the Spanish Data Protection Authority (AEPD) at',
        s8p1: 'The Ascendr platform is not directed at children under 14 years of age. We do not knowingly collect personal data from children under 14. If you believe a minor has provided us with personal data without appropriate consent, please contact us so we can delete it promptly.',
        s9p1: 'We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. We encourage you to review this policy periodically. Material changes will be communicated to registered users via email or an in-app notice.',
        footer: '© 2026 Ascendr · All rights reserved',
      },
    },
    es: {
      title1: 'Política de ', title2: 'Privacidad',
      updated: 'Última actualización: septiembre de 2026',
      cookieBtn: 'Gestionar preferencias de cookies',
      chipLabels: { tradingName: 'Nombre comercial', address: 'Dirección' },
      sections: [
        '1. Responsable del Tratamiento',
        '2. Datos Personales que Recogemos',
        '3. Cookies y Tecnologías de Seguimiento',
        '4. Finalidades y Base Legal del Tratamiento',
        '5. Conservación de Datos',
        '6. Destinatarios y Transferencias Internacionales',
        '7. Sus Derechos',
        '8. Menores',
        '9. Cambios en esta Política',
      ],
      body: {
        chipValues: { tradingName: 'Ascendr', address: 'Barcelona, España' },
        s1intro: 'Ascendr trata datos personales en calidad de responsable del tratamiento en el sentido del Reglamento General de Protección de Datos (UE) 2016/679 (RGPD) y de la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).',
        s2intro: 'Solo recogemos los datos necesarios para prestar el servicio Ascendr. En función de cómo utilice la plataforma, estos pueden incluir:',
        s2categories: [
          ['Datos de cuenta',          'Nombre de usuario, dirección de correo electrónico y género seleccionado. Los facilita usted al crear una cuenta.'],
          ['Datos de competición',     'Categorías, dorsales, puntuaciones (cimas, zonas, intentos), marcas de tiempo de las vías registradas y atributos por competición asignados por los organizadores.'],
          ['Datos de perfil',          'Un avatar emoji opcional elegido por el usuario. No se procesan fotografías de perfil ni datos biométricos.'],
          ['Datos de sesión de uso',   'Registros estándar del servidor web (dirección IP, tipo de navegador, páginas visitadas) conservados brevemente por motivos de seguridad y depuración. No se realiza seguimiento entre sitios.'],
        ] as [string, string][],
        s3intro: 'Ascendr utiliza un conjunto limitado de cookies y entradas de almacenamiento local. No utilizamos cookies publicitarias ni compartimos datos de navegación con intermediarios de datos.',
        s3essentialHeading: 'Técnicamente necesarias (no requieren consentimiento)',
        s3essentialCookies: [
          ['Token de sesión',                    'Supabase', 'Le mantiene conectado. Almacenado en localStorage.',                          'Duración de la sesión'],
          ['Preferencia de idioma',              'Ascendr',  'Almacena el idioma seleccionado (EN/ES/CA) en localStorage.',                 'Persistente'],
          ['Elección del consentimiento de cookies', 'Ascendr', 'Almacena si aceptó o rechazó las cookies analíticas.',                    '1 año'],
        ] as [string, string, string, string][],
        s3analyticsHeading: 'Cookies analíticas (requieren consentimiento)',
        s3analyticsBefore: 'Con su consentimiento, Ascendr utiliza ',
        s3analyticsAfter: ' (a través de Google Tag Manager) para comprender cómo los visitantes utilizan el sitio y mejorarlo. No se realiza publicidad ni perfilado entre sitios.',
        s3analyticsCookies: [
          ['_ga',            'Google Analytics', 'Identifica usuarios únicos entre sesiones.',                 '2 años'],
          ['_ga_SL24MGJ1ZX', 'Google Analytics', 'Almacena y contabiliza las sesiones de páginas vistas.',    '2 años'],
        ] as [string, string, string, string][],
        s3gdprPara: 'Los datos recopilados por Google Analytics son procesados por Google LLC (EE. UU.) en virtud del Marco de Privacidad de Datos UE-EE. UU. Para más información, consulte',
        s3gdprLinkText: 'la Política de Privacidad de Google',
        s4purposes: [
          ['Gestión de cuenta y prestación del servicio', 'Para crear y mantener su cuenta de usuario y proporcionar acceso a la plataforma Ascendr.',                                                                                                                                           'Ejecución de contrato — Art. 6(1)(b) RGPD'],
          ['Participación en competiciones',              'Para inscribirle en competiciones, asignar dorsales, registrar puntuaciones y mostrar sus resultados en las clasificaciones.',                                                                                                        'Ejecución de contrato — Art. 6(1)(b) RGPD'],
          ['Clasificaciones públicas',                    'Los resultados de la competición (nombre, dorsal, puntuación) pueden mostrarse en páginas de resultados públicas enlazadas por el organizador de la competición.',                                                                    'Interés legítimo — Art. 6(1)(f) RGPD'],
          ['Analíticas (con consentimiento)',             'Utilizamos Google Analytics 4 para entender cómo se usa el sitio y mejorar el producto. Las cookies analíticas solo se establecen una vez que otorga su consentimiento explícito mediante el banner de cookies.',                   'Consentimiento — Art. 6(1)(a) RGPD'],
          ['Seguridad y prevención del abuso',            'Los registros del servidor y los datos de sesión se procesan para detectar y prevenir accesos no autorizados.',                                                                                                                       'Interés legítimo — Art. 6(1)(f) RGPD'],
          ['Cumplimiento legal',                          'Conservamos los datos según exigen las obligaciones fiscales y legales aplicables.',                                                                                                                                                   'Obligación legal — Art. 6(1)(c) RGPD'],
        ] as [string, string, string][],
        s5intro: 'Conservamos sus datos personales solo durante el tiempo necesario para los fines descritos anteriormente:',
        s5items: [
          'Los datos de la cuenta se conservan mientras su cuenta esté activa. Si solicita la eliminación de su cuenta, sus datos se suprimirán en un plazo de 30 días, salvo que la ley exija su conservación.',
          'Los datos de resultados de competiciones (puntuaciones, clasificaciones) pueden conservarse en forma anonimizada o agregada más allá de la eliminación de la cuenta con fines estadísticos e históricos.',
          'Los registros del servidor se conservan un máximo de 90 días por motivos de seguridad.',
        ],
        s6intro: 'Ascendr no vende sus datos personales a terceros. Sus datos solo pueden compartirse con:',
        s6items: [
          'Proveedores de alojamiento e infraestructura (Supabase, Vercel) que tratan los datos en nuestro nombre bajo acuerdos de tratamiento de datos apropiados.',
          'Google LLC — para analíticas mediante Google Analytics 4 y Google Tag Manager, únicamente cuando haya dado su consentimiento. Los datos pueden procesarse en EE. UU. bajo el Marco de Privacidad de Datos UE-EE. UU.',
          'Procesadores de pago (Stripe) para el procesamiento de las tarifas de competición. Los datos de pago son gestionados directamente por el proveedor de pago y no son almacenados por Ascendr.',
          'Autoridades públicas, cuando así lo exija la ley.',
        ],
        s6p2: 'Cualquier transferencia fuera del Espacio Económico Europeo se realiza con las garantías adecuadas de conformidad con el Capítulo V del RGPD.',
        s7intro: 'En virtud del RGPD y la LOPDGDD, usted dispone de los siguientes derechos sobre sus datos personales:',
        s7rights: [
          ['Acceso',               'Solicitar una copia de los datos que conservamos sobre usted.'],
          ['Rectificación',        'Pedirnos que corrijamos datos inexactos o incompletos.'],
          ['Supresión',            'Solicitar la eliminación de sus datos («derecho al olvido»).'],
          ['Limitación',           'Pedirnos que restrinjamos el tratamiento de sus datos en determinadas circunstancias.'],
          ['Portabilidad',         'Recibir sus datos en un formato estructurado y legible por máquina.'],
          ['Oposición',            'Oponerse al tratamiento basado en el interés legítimo.'],
          ['Retirar el consentimiento', 'Cuando el tratamiento se basa en el consentimiento, retirarlo en cualquier momento sin afectar al tratamiento anterior.'],
        ] as [string, string][],
        s7exercise: 'Para ejercer cualquiera de estos derechos, utilice la configuración de la cuenta en la aplicación Ascendr o contáctenos a través del canal de soporte integrado en la aplicación. Responderemos en un plazo de 30 días. También tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) en',
        s8p1: 'La plataforma Ascendr no está dirigida a menores de 14 años. No recogemos conscientemente datos personales de menores de 14 años. Si cree que un menor nos ha facilitado datos personales sin el consentimiento adecuado, contáctenos para que podamos eliminarlos de inmediato.',
        s9p1: 'Podemos actualizar esta Política de Privacidad periódicamente. Cuando lo hagamos, revisaremos la fecha de «Última actualización» en la parte superior de esta página. Le recomendamos que revise esta política de forma regular. Los cambios sustanciales se comunicarán a los usuarios registrados por correo electrónico o mediante un aviso en la aplicación.',
        footer: '© 2026 Ascendr · Todos los derechos reservados',
      },
    },
    ca: {
      title1: 'Política de ', title2: 'Privacitat',
      updated: 'Darrera actualització: setembre de 2026',
      cookieBtn: 'Gestionar preferències de galetes',
      chipLabels: { tradingName: 'Nom comercial', address: 'Adreça' },
      sections: [
        '1. Responsable del Tractament',
        '2. Dades Personals que Recollim',
        '3. Galetes i Tecnologies de Seguiment',
        '4. Finalitats i Base Jurídica del Tractament',
        '5. Conservació de Dades',
        '6. Destinataris i Transferències Internacionals',
        '7. Els Vostres Drets',
        '8. Menors',
        '9. Canvis en aquesta Política',
      ],
      body: {
        chipValues: { tradingName: 'Ascendr', address: 'Barcelona, Espanya' },
        s1intro: "Ascendr tracta dades personals en qualitat de responsable del tractament en el sentit del Reglament General de Protecció de Dades (UE) 2016/679 (RGPD) i de la Llei Orgànica 3/2018, de 5 de desembre, de Protecció de Dades Personals i garantia dels drets digitals (LOPDGDD).",
        s2intro: "Només recollim les dades necessàries per prestar el servei Ascendr. En funció de com faci servir la plataforma, poden incloure:",
        s2categories: [
          ["Dades de compte",          "Nom d'usuari, adreça de correu electrònic i gènere escollit. Les facilita vostè en crear un compte."],
          ["Dades de competició",      "Categories, dorsals, puntuacions (cims, zones, intents), marques de temps de les vies registrades i atributs per competició assignats pels organitzadors."],
          ["Dades de perfil",          "Un avatar emoji opcional escollit per l'usuari. No es processen fotografies de perfil ni dades biomètriques."],
          ["Dades de sessió d'ús",     "Registres estàndard del servidor web (adreça IP, tipus de navegador, pàgines visitades) conservats breument per motius de seguretat i depuració. No es realitza cap seguiment entre llocs."],
        ] as [string, string][],
        s3intro: "Ascendr utilitza un conjunt limitat de cookies i entrades d'emmagatzematge local. No fem servir cookies publicitàries ni compartim dades de navegació amb intermediaris de dades.",
        s3essentialHeading: 'Tècnicament necessàries (no requereixen consentiment)',
        s3essentialCookies: [
          ["Testimoni de sessió",               'Supabase', "Us manté connectat. Emmagatzemat en localStorage.",                          "Durada de la sessió"],
          ["Preferència d'idioma",              'Ascendr',  "Emmagatzema l'idioma seleccionat (EN/ES/CA) en localStorage.",               "Persistent"],
          ["Elecció del consentiment de cookies", 'Ascendr', "Emmagatzema si vau acceptar o rebutjar les cookies analítiques.",          "1 any"],
        ] as [string, string, string, string][],
        s3analyticsHeading: 'Cookies analítiques (requereixen consentiment)',
        s3analyticsBefore: "Amb el vostre consentiment, Ascendr fa servir ",
        s3analyticsAfter: " (a través de Google Tag Manager) per entendre com els visitants fan servir el lloc i millorar-lo. No es realitza publicitat ni perfilatge entre llocs.",
        s3analyticsCookies: [
          ['_ga',            'Google Analytics', 'Identifica usuaris únics entre sessions.',                  '2 anys'],
          ['_ga_SL24MGJ1ZX', 'Google Analytics', 'Emmagatzema i comptabilitza les sessions de pàgines vistes.', '2 anys'],
        ] as [string, string, string, string][],
        s3gdprPara: "Les dades recollides per Google Analytics són processades per Google LLC (EUA) en virtut del Marc de Privacitat de Dades UE-EUA. Per a més informació, consulteu",
        s3gdprLinkText: "la Política de Privacitat de Google",
        s4purposes: [
          ["Gestió de compte i prestació del servei", "Per crear i mantenir el seu compte d'usuari i proporcionar accés a la plataforma Ascendr.",                                                                                                                                              "Execució de contracte — Art. 6(1)(b) RGPD"],
          ["Participació en competicions",            "Per inscriure-la en competicions, assignar dorsals, registrar puntuacions i mostrar els seus resultats en les classificacions.",                                                                                                          "Execució de contracte — Art. 6(1)(b) RGPD"],
          ["Classificacions públiques",               "Els resultats de la competició (nom, dorsal, puntuació) es poden mostrar en pàgines de resultats públiques enllaçades per l'organitzador de la competició.",                                                                             "Interès legítim — Art. 6(1)(f) RGPD"],
          ["Analítiques (amb consentiment)",          "Fem servir Google Analytics 4 per entendre com s'utilitza el lloc i millorar el producte. Les cookies analítiques només s'estableixen un cop vostè dóna el seu consentiment explícit mitjançant el bàner de cookies.",               "Consentiment — Art. 6(1)(a) RGPD"],
          ["Seguretat i prevenció de l'abús",         "Els registres del servidor i les dades de sessió es processen per detectar i prevenir accessos no autoritzats.",                                                                                                                          "Interès legítim — Art. 6(1)(f) RGPD"],
          ["Compliment legal",                        "Conservem les dades segons exigeixen les obligacions fiscals i legals aplicables.",                                                                                                                                                        "Obligació legal — Art. 6(1)(c) RGPD"],
        ] as [string, string, string][],
        s5intro: "Conservem les seves dades personals només durant el temps necessari per als fins descrits anteriorment:",
        s5items: [
          "Les dades del compte es conserven mentre el seu compte estigui actiu. Si sol·licita l'eliminació del compte, les seves dades seran suprimides en un termini de 30 dies, llevat que la llei n'exigeixi la conservació.",
          "Les dades de resultats de competicions (puntuacions, classificacions) poden conservar-se en forma anonimitzada o agregada més enllà de l'eliminació del compte amb finalitats estadístiques i històriques.",
          "Els registres del servidor es conserven un màxim de 90 dies per motius de seguretat.",
        ],
        s6intro: "Ascendr no ven les seves dades personals a tercers. Les seves dades només es poden compartir amb:",
        s6items: [
          "Proveïdors d'allotjament i infraestructura (Supabase, Vercel) que tracten les dades en nom nostre sota acords de tractament de dades adequats.",
          "Google LLC — per a analítiques mitjançant Google Analytics 4 i Google Tag Manager, únicament quan vostè hagi donat el seu consentiment. Les dades poden processar-se als EUA sota el Marc de Privacitat de Dades UE-EUA.",
          "Processadors de pagament (Stripe) per al processament de les tarifes de competició. Les dades de pagament són gestionades directament pel proveïdor de pagament i no s'emmagatzemen per Ascendr.",
          "Autoritats públiques, quan així ho exigeixi la llei.",
        ],
        s6p2: "Qualsevol transferència fora de l'Espai Econòmic Europeu es realitza amb les garanties adequades de conformitat amb el Capítol V del RGPD.",
        s7intro: "En virtut del RGPD i la LOPDGDD, vostè disposa dels drets següents sobre les seves dades personals:",
        s7rights: [
          ["Accés",                  "Sol·licitar una còpia de les dades que conservem sobre vostè."],
          ["Rectificació",           "Demanar-nos que corregim dades inexactes o incompletes."],
          ["Supressió",              "Sol·licitar l'eliminació de les seves dades («dret a l'oblit»)."],
          ["Limitació",              "Demanar-nos que restringim el tractament de les seves dades en determinades circumstàncies."],
          ["Portabilitat",           "Rebre les seves dades en un format estructurat i llegible per màquina."],
          ["Oposició",               "Oposar-se al tractament basat en l'interès legítim."],
          ["Retirar el consentiment","Quan el tractament es basa en el consentiment, retirar-lo en qualsevol moment sense afectar el tractament anterior."],
        ] as [string, string][],
        s7exercise: "Per exercir qualsevol d'aquests drets, faci servir la configuració del compte a l'aplicació Ascendr o contacti'ns a través del canal de suport integrat a l'aplicació. Respondrem en un termini de 30 dies. Vostè també té dret a presentar una reclamació davant l'Agència Espanyola de Protecció de Dades (AEPD) a",
        s8p1: "La plataforma Ascendr no està dirigida a menors de 14 anys. No recollim conscientment dades personals de menors de 14 anys. Si creu que un menor ens ha facilitat dades personals sense el consentiment adequat, contacti'ns per tal que puguem eliminar-les de manera immediata.",
        s9p1: "Podem actualitzar aquesta Política de Privacitat periòdicament. Quan ho fem, revisarem la data de «Darrera actualització» a la part superior d'aquesta pàgina. Us animem a revisar aquesta política de manera regular. Els canvis substancials es comunicaran als usuaris registrats per correu electrònic o mitjançant un avís a l'aplicació.",
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

        {/* Intro */}
        <Section title={L.sections[0]}>
          <P>
            {L.body.s1intro}
          </P>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px', marginTop: 16, display: 'grid', rowGap: 12 }}>
            <InfoChip label={L.chipLabels.tradingName} value={L.body.chipValues.tradingName} />
            <InfoChip label={L.chipLabels.address}     value={L.body.chipValues.address} />
          </div>
        </Section>

        {/* What we collect */}
        <Section title={L.sections[1]}>
          <P>
            {L.body.s2intro}
          </P>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {L.body.s2categories.map(([label, desc]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, margin: '0 0 4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ fontSize: 13, color: C.txtMid, lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Cookies */}
        <Section title={L.sections[2]}>
          <P>
            {L.body.s3intro}
          </P>

          {/* Essential */}
          <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, margin: '16px 0 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{L.body.s3essentialHeading}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {L.body.s3essentialCookies.map(([name, prov, desc, dur]) => (
              <div key={name} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', display: 'grid', rowGap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.txt }}>{name}</span>
                  <span style={{ fontSize: 11, color: C.txtLow }}>{prov} · {dur}</span>
                </div>
                <p style={{ fontSize: 12, color: C.txtMid, lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Analytics */}
          <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, margin: '20px 0 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{L.body.s3analyticsHeading}</p>
          <P>
            {L.body.s3analyticsBefore}<strong style={{ color: C.txt }}>Google Analytics 4</strong>{L.body.s3analyticsAfter}
          </P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {L.body.s3analyticsCookies.map(([name, prov, desc, dur]) => (
              <div key={name} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', display: 'grid', rowGap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.txt, fontFamily: "'SF Mono','Fira Code',monospace" }}>{name}</span>
                  <span style={{ fontSize: 11, color: C.txtLow }}>{prov} · {dur}</span>
                </div>
                <p style={{ fontSize: 12, color: C.txtMid, lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
          <P>
            {L.body.s3gdprPara}{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>{L.body.s3gdprLinkText}</a>.
          </P>
          <div style={{ marginTop: 8 }}>
            <button
              onClick={openCookiePreferences}
              style={{
                background: 'rgba(127,139,173,0.12)', border: '1px solid rgba(127,139,173,0.3)',
                color: '#7F8BAD', fontSize: 13, fontWeight: 600,
                padding: '8px 18px', borderRadius: 7, cursor: 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                letterSpacing: '-0.01em',
              }}
            >
              {L.cookieBtn}
            </button>
          </div>
        </Section>

        {/* Purposes */}
        <Section title={L.sections[3]}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {L.body.s4purposes.map(([purpose, desc, basis]) => (
              <div key={purpose} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.txt, margin: '0 0 4px' }}>{purpose}</p>
                <p style={{ fontSize: 13, color: C.txtMid, lineHeight: 1.65, margin: '0 0 6px' }}>{desc}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.accent, margin: 0 }}>{basis}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Retention */}
        <Section title={L.sections[4]}>
          <P>
            {L.body.s5intro}
          </P>
          <ul style={{ paddingLeft: 20, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {L.body.s5items.map(item => (
              <li key={item} style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
        </Section>

        {/* Recipients */}
        <Section title={L.sections[5]}>
          <P>
            {L.body.s6intro}
          </P>
          <ul style={{ paddingLeft: 20, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {L.body.s6items.map(item => (
              <li key={item} style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
          <P>
            {L.body.s6p2}
          </P>
        </Section>

        {/* Rights */}
        <Section title={L.sections[6]}>
          <P>
            {L.body.s7intro}
          </P>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 8 }}>
            {L.body.s7rights.map(([right, desc]) => (
              <div key={right} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{right}</p>
                <p style={{ fontSize: 12, color: C.txtMid, lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.75, margin: '16px 0 0' }}>
            {L.body.s7exercise}{' '}
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>www.aepd.es</a>.
          </p>
        </Section>

        {/* Minors */}
        <Section title={L.sections[7]}>
          <P>
            {L.body.s8p1}
          </P>
        </Section>

        {/* Changes */}
        <Section title={L.sections[8]}>
          <P>
            {L.body.s9p1}
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
