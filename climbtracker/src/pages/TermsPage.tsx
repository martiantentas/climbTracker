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

// ─── TERMS PAGE ───────────────────────────────────────────────────────────────

export default function TermsPage({ lang }: { lang: Language }) {
  const navigate = useNavigate()
  const t = translations[lang]

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const L = {
    en: {
      title1: 'Terms & ', title2: 'Conditions',
      updated: 'Last updated: April 2026',
      sections: [
        '1. Acceptance of Terms',
        '2. Service Description',
        '3. Account Registration',
        '4. Organiser Responsibilities',
        '5. Plans, Pricing, and Payment',
        '6. Acceptable Use',
        '7. Intellectual Property',
        '8. Limitation of Liability',
        '9. Termination',
        '10. Governing Law and Dispute Resolution',
        '11. Changes to These Terms',
        '12. Contact',
      ],
      body: {
        s1p1: 'By accessing or using the Ascendr platform — including creating a user account, participating in a competition, or purchasing a plan as an organiser — you agree to be bound by these Terms and Conditions, together with the Privacy Policy and Legal Notice published on this site.',
        s1p2: 'If you do not agree with any part of these Terms, you must not use the Ascendr service. These Terms apply to all users, including competition organisers, judges, and participants.',
        s2intro: 'Ascendr is a Software-as-a-Service (SaaS) platform for the organisation and management of boulder climbing competitions. The platform enables:',
        s2items: [
          'Competition organisers to create events, configure boulders and scoring rules, manage participants and judges, and publish live and final results.',
          'Judges to validate tops and zones in real time using the Judging Panel.',
          'Participants to register via invite code, log their own ascents (where enabled by the organiser), and follow the live leaderboard.',
          'Public visitors to view results on competition result pages without creating an account.',
        ],
        s2p2: 'Ascendr is provided on an "as-is" basis. We reserve the right to modify, suspend, or discontinue any part of the service at any time, with reasonable notice where possible.',
        s3intro: 'To use Ascendr, you must register an account by providing a valid email address, a display name, and creating a password. You warrant that:',
        s3items: [
          'The information you provide is accurate, current, and complete.',
          'You are at least 14 years of age, or that your parent or guardian has provided consent where required by applicable law.',
          'You will maintain the confidentiality of your login credentials and are responsible for all activity under your account.',
          'You will notify us immediately of any unauthorised use of your account.',
        ],
        s3p2: 'We reserve the right to suspend or terminate accounts that violate these Terms.',
        s4intro: 'Users who create and manage competitions ("Organisers") take on additional responsibilities:',
        s4items: [
          'Organisers are solely responsible for the accuracy of competition configuration, including boulder grades, scoring rules, and participant data.',
          'Organisers must obtain any necessary consents from participants before entering their personal data (name, gender, category) into the platform.',
          'Organisers are responsible for communicating to participants how their data will be used, including publication of results on public leaderboard pages.',
          'Organisers must comply with all applicable sporting federation rules, safety regulations, and local law when running events.',
          'Ascendr is a software tool — it does not assume liability for decisions made by organisers or the conduct of events.',
        ],
        s5intro: 'Ascendr is offered on a per-event subscription basis. Published prices are in euros (€) and include applicable VAT.',
        s5plans: [
          ['Standard — €129 / event', 'Up to 300 participants. Includes live leaderboard, flexible scoring, analytics, judge and self-scoring modes, and extra capacity bundles at €0.12 per participant above 300.'],
          ['Premium — €209 / event', 'Up to 500 participants. Includes all Standard features plus white-label logo, custom accent colour, and branded theme colours. Overage at €0.10 per participant above 500.'],
        ] as [string, string][],
        s5p2: "Payment is due before a competition is set to Live status. Ascendr uses a third-party payment processor; by completing a payment you also agree to that processor's terms. Ascendr does not store full payment card details.",
        s5refundLabel: 'Refund policy:',
        s5refundText: ' Competition plans are non-refundable once the competition has been published (status set to Live). If you encounter a technical issue that prevents the service from functioning as described, contact us within 7 days and we will investigate and offer a remedy at our discretion.',
        s6intro: 'You agree not to use Ascendr to:',
        s6items: [
          'Violate any applicable law or regulation.',
          'Submit false, misleading, or fraudulent competition scores or participant data.',
          'Attempt to gain unauthorised access to the platform, other user accounts, or our infrastructure.',
          'Introduce malware, viruses, or any code designed to disrupt or damage the service.',
          'Scrape or harvest data from the platform in an automated manner without our written consent.',
          'Use the service to harass, defame, or harm any individual.',
          'Reverse-engineer, decompile, or attempt to extract the source code of Ascendr.',
        ],
        s6p2: 'Violations may result in immediate account suspension and, where applicable, legal action.',
        s7p1: 'All intellectual property rights in the Ascendr platform — including the software, design, logos, and documentation — are and remain the property of the owner. These Terms do not grant you any rights other than a limited, non-exclusive, non-transferable licence to use the service for its intended purpose during the term of your subscription.',
        s7p2: 'Content created by users (such as competition names, boulder descriptions, and result data) remains the property of the respective user or organiser. By posting content on the platform, you grant Ascendr a worldwide, royalty-free licence to host, reproduce, and display that content solely for the purpose of operating the service.',
        s8p1: 'To the maximum extent permitted by law, Ascendr shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the service.',
        s8p2: 'Our total aggregate liability to you in respect of any claims under or in connection with these Terms shall not exceed the amount paid by you for the competition plan giving rise to the claim in the twelve months preceding the claim.',
        s8p3: 'Nothing in these Terms limits liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded or limited under applicable law.',
        s9p1: 'You may delete your account at any time via the account settings. On deletion, your personal data will be removed in accordance with our Privacy Policy.',
        s9p2: 'We may suspend or terminate your account immediately if you breach these Terms, if we reasonably suspect fraudulent or harmful activity, or if we are required to do so by law. Where feasible, we will give prior notice of termination.',
        s9p3: 'Termination of your account does not entitle you to a refund of any fees already paid for a live or completed competition.',
        s10p1: 'These Terms and Conditions are governed by Spanish law. In particular, they are subject to the General Law for the Defence of Consumers and Users (Real Decreto Legislativo 1/2007) in relation to B2C transactions.',
        s10p2: 'Any dispute arising from or in connection with these Terms shall first be attempted to be resolved amicably. If no resolution is reached within 30 days, disputes shall be submitted to the courts of the owner\'s registered address, unless mandatory consumer protection law designates another competent court.',
        s10p3: "EU residents may also use the European Commission's Online Dispute Resolution platform at",
        s11p1: 'We may update these Terms at any time. Material changes will be notified to registered users via email or an in-app message at least 14 days before they take effect. Continued use of the service after the effective date constitutes acceptance of the updated Terms.',
        s11p2: 'The current version of the Terms is always available at this URL. We recommend you save or print a copy for your records.',
        s12p1: 'For any questions regarding these Terms, please contact us at',
        footer: '© 2026 Ascendr · All rights reserved',
      },
    },
    es: {
      title1: 'Términos y ', title2: 'Condiciones',
      updated: 'Última actualización: abril de 2026',
      sections: [
        '1. Aceptación de los Términos',
        '2. Descripción del Servicio',
        '3. Registro de Cuenta',
        '4. Responsabilidades del Organizador',
        '5. Planes, Precios y Pago',
        '6. Uso Aceptable',
        '7. Propiedad Intelectual',
        '8. Limitación de Responsabilidad',
        '9. Rescisión',
        '10. Ley Aplicable y Resolución de Conflictos',
        '11. Cambios en estos Términos',
        '12. Contacto',
      ],
      body: {
        s1p1: 'Al acceder o utilizar la plataforma Ascendr —incluyendo la creación de una cuenta de usuario, la participación en una competición o la contratación de un plan como organizador— usted acepta quedar vinculado por estos Términos y Condiciones, junto con la Política de Privacidad y el Aviso Legal publicados en este sitio.',
        s1p2: 'Si no está de acuerdo con alguna parte de estos Términos, no debe utilizar el servicio Ascendr. Estos Términos se aplican a todos los usuarios, incluidos organizadores de competiciones, jueces y participantes.',
        s2intro: 'Ascendr es una plataforma de Software como Servicio (SaaS) para la organización y gestión de competiciones de escalada en boulder. La plataforma permite:',
        s2items: [
          'A los organizadores crear eventos, configurar blocs y reglas de puntuación, gestionar participantes y jueces, y publicar resultados en tiempo real y finales.',
          'A los jueces validar cimas y zonas en tiempo real mediante el Panel de Juicio.',
          'A los participantes inscribirse mediante código de invitación, registrar sus propias vías (cuando el organizador lo habilite) y seguir la clasificación en directo.',
          'A los visitantes públicos consultar los resultados en las páginas de competición sin necesidad de crear una cuenta.',
        ],
        s2p2: 'Ascendr se presta en modalidad "tal cual". Nos reservamos el derecho a modificar, suspender o interrumpir cualquier parte del servicio en cualquier momento, con el aviso razonable que sea posible.',
        s3intro: 'Para utilizar Ascendr, debe registrar una cuenta proporcionando una dirección de correo electrónico válida, un nombre de usuario y una contraseña. Usted declara que:',
        s3items: [
          'La información facilitada es exacta, actual y completa.',
          'Tiene al menos 14 años, o que su padre, madre o tutor ha prestado el consentimiento requerido por la legislación aplicable.',
          'Mantendrá la confidencialidad de sus credenciales de acceso y es responsable de toda la actividad realizada con su cuenta.',
          'Nos notificará de inmediato cualquier uso no autorizado de su cuenta.',
        ],
        s3p2: 'Nos reservamos el derecho a suspender o cancelar las cuentas que incumplan estos Términos.',
        s4intro: 'Los usuarios que crean y gestionan competiciones («Organizadores») asumen responsabilidades adicionales:',
        s4items: [
          'Los organizadores son los únicos responsables de la exactitud de la configuración de la competición, incluidas las graduaciones de los blocs, las reglas de puntuación y los datos de los participantes.',
          'Los organizadores deben obtener los consentimientos necesarios de los participantes antes de introducir sus datos personales (nombre, género, categoría) en la plataforma.',
          'Los organizadores son responsables de informar a los participantes sobre el uso de sus datos, incluida la publicación de resultados en páginas de clasificación públicas.',
          'Los organizadores deben cumplir con todas las normas de la federación deportiva aplicable, los reglamentos de seguridad y la legislación local vigente al organizar eventos.',
          'Ascendr es una herramienta de software y no asume responsabilidad alguna por las decisiones adoptadas por los organizadores ni por el desarrollo de los eventos.',
        ],
        s5intro: 'Ascendr se ofrece mediante suscripción por evento. Los precios publicados están en euros (€) e incluyen el IVA aplicable.',
        s5plans: [
          ['Standard — 129 € / evento', 'Hasta 300 participantes. Incluye clasificación en directo, puntuación flexible, analíticas, modos de puntuación por juez y autoregistro, y paquetes de capacidad adicional a 0,12 € por participante a partir de 300.'],
          ['Premium — 209 € / evento', 'Hasta 500 participantes. Incluye todas las funcionalidades Standard más logotipo de marca blanca, color de acento personalizado y colores de tema de marca. Exceso a 0,10 € por participante a partir de 500.'],
        ] as [string, string][],
        s5p2: 'El pago debe realizarse antes de activar el estado En Vivo de la competición. Ascendr utiliza un procesador de pago externo; al completar un pago, usted acepta también los términos de dicho procesador. Ascendr no almacena los datos completos de la tarjeta de pago.',
        s5refundLabel: 'Política de reembolso:',
        s5refundText: ' Los planes de competición no son reembolsables una vez que la competición ha sido publicada (estado En Vivo). Si experimenta un problema técnico que impide el funcionamiento del servicio tal y como se describe, contáctenos en un plazo de 7 días y estudiaremos el caso para ofrecer una solución a nuestra discreción.',
        s6intro: 'Usted se compromete a no utilizar Ascendr para:',
        s6items: [
          'Infringir cualquier ley o reglamento aplicable.',
          'Enviar puntuaciones de competición o datos de participantes falsos, engañosos o fraudulentos.',
          'Intentar acceder sin autorización a la plataforma, a otras cuentas de usuario o a nuestra infraestructura.',
          'Introducir malware, virus o cualquier código diseñado para interrumpir o dañar el servicio.',
          'Extraer o recopilar datos de la plataforma de forma automatizada sin nuestro consentimiento por escrito.',
          'Utilizar el servicio para acosar, difamar o perjudicar a cualquier persona.',
          'Realizar ingeniería inversa, descompilar o intentar extraer el código fuente de Ascendr.',
        ],
        s6p2: 'Las infracciones pueden resultar en la suspensión inmediata de la cuenta y, en su caso, en acciones legales.',
        s7p1: 'Todos los derechos de propiedad intelectual sobre la plataforma Ascendr —incluido el software, el diseño, los logotipos y la documentación— son y seguirán siendo propiedad del titular. Estos Términos no le otorgan más derechos que una licencia limitada, no exclusiva e intransferible para usar el servicio con su finalidad prevista durante la vigencia de su suscripción.',
        s7p2: 'El contenido creado por los usuarios (como nombres de competiciones, descripciones de blocs y datos de resultados) sigue siendo propiedad del usuario u organizador correspondiente. Al publicar contenido en la plataforma, usted concede a Ascendr una licencia mundial y libre de regalías para alojar, reproducir y mostrar dicho contenido exclusivamente con la finalidad de operar el servicio.',
        s8p1: 'En la máxima medida permitida por la ley, Ascendr no será responsable de ningún daño indirecto, incidental, especial, consecuente o punitivo, incluida la pérdida de beneficios, datos o reputación, derivado del uso o la imposibilidad de uso del servicio.',
        s8p2: 'La responsabilidad total acumulada de Ascendr frente a usted en relación con cualquier reclamación en virtud de estos Términos o en conexión con ellos no excederá el importe abonado por usted por el plan de competición que dio origen a la reclamación en los doce meses anteriores a la misma.',
        s8p3: 'Nada en estos Términos limita la responsabilidad por muerte o lesiones personales causadas por negligencia, fraude o declaración fraudulenta, ni cualquier otra responsabilidad que no pueda excluirse o limitarse en virtud de la legislación aplicable.',
        s9p1: 'Puede eliminar su cuenta en cualquier momento desde la configuración de la cuenta. Tras la eliminación, sus datos personales serán suprimidos de conformidad con nuestra Política de Privacidad.',
        s9p2: 'Podemos suspender o cancelar su cuenta de inmediato si incumple estos Términos, si sospechamos razonablemente una actividad fraudulenta o perjudicial, o si estamos obligados a ello por ley. Cuando sea posible, le notificaremos previamente la rescisión.',
        s9p3: 'La cancelación de su cuenta no le otorga derecho a reembolso de ninguna tarifa ya abonada por una competición activa o finalizada.',
        s10p1: 'Estos Términos y Condiciones se rigen por la legislación española. En particular, se someten al Real Decreto Legislativo 1/2007, de la Ley General para la Defensa de los Consumidores y Usuarios, en relación con las transacciones entre empresas y consumidores.',
        s10p2: 'Cualquier controversia derivada de o relacionada con estos Términos se intentará resolver primero de forma amistosa. Si no se alcanza una solución en el plazo de 30 días, las disputas se someterán a los juzgados y tribunales del domicilio del titular, salvo que la legislación imperativa de protección al consumidor designe otro tribunal competente.',
        s10p3: 'Los residentes en la UE también pueden utilizar la plataforma de Resolución de Litigios en Línea de la Comisión Europea en',
        s11p1: 'Podemos actualizar estos Términos en cualquier momento. Los cambios sustanciales se notificarán a los usuarios registrados por correo electrónico o mediante un mensaje en la aplicación con al menos 14 días de antelación a su entrada en vigor. El uso continuado del servicio tras la fecha efectiva constituye la aceptación de los Términos actualizados.',
        s11p2: 'La versión vigente de los Términos está siempre disponible en esta URL. Le recomendamos que guarde o imprima una copia para su archivo personal.',
        s12p1: 'Para cualquier consulta sobre estos Términos, puede contactar con nosotros en',
        footer: '© 2026 Ascendr · Todos los derechos reservados',
      },
    },
    ca: {
      title1: 'Termes i ', title2: 'Condicions',
      updated: 'Darrera actualització: abril de 2026',
      sections: [
        '1. Acceptació dels Termes',
        '2. Descripció del Servei',
        '3. Registre de Compte',
        "4. Responsabilitats de l'Organitzador",
        '5. Plans, Preus i Pagament',
        '6. Ús Acceptable',
        '7. Propietat Intel·lectual',
        '8. Limitació de Responsabilitat',
        '9. Rescissió',
        '10. Llei Aplicable i Resolució de Conflictes',
        '11. Canvis en aquests Termes',
        '12. Contacte',
      ],
      body: {
        s1p1: "En accedir o fer servir la plataforma Ascendr —incloent-hi la creació d'un compte d'usuari, la participació en una competició o la contractació d'un pla com a organitzador— vostè accepta quedar vinculat per aquests Termes i Condicions, juntament amb la Política de Privacitat i l'Avís Legal publicats en aquest lloc.",
        s1p2: "Si no està d'acord amb cap part d'aquests Termes, no ha d'utilitzar el servei Ascendr. Aquests Termes s'apliquen a tots els usuaris, inclosos organitzadors de competicions, jutges i participants.",
        s2intro: "Ascendr és una plataforma de Programari com a Servei (SaaS) per a l'organització i la gestió de competicions d'escalada en boulder. La plataforma permet:",
        s2items: [
          "Als organitzadors crear esdeveniments, configurar blocs i regles de puntuació, gestionar participants i jutges, i publicar resultats en directe i finals.",
          'Als jutges validar cims i zones en temps real mitjançant el Panell de Jutjament.',
          "Als participants inscriure's mitjançant codi d'invitació, registrar les seves pròpies vies (quan l'organitzador ho habiliti) i seguir la classificació en directe.",
          "Als visitants públics consultar els resultats a les pàgines de competició sense necessitat de crear un compte.",
        ],
        s2p2: 'Ascendr es presta en modalitat "tal com és". Ens reservem el dret a modificar, suspendre o interrompre qualsevol part del servei en qualsevol moment, amb el preavís raonable que sigui possible.',
        s3intro: "Per utilitzar Ascendr, cal registrar un compte proporcionant una adreça de correu electrònic vàlida, un nom d'usuari i una contrasenya. Vostè declara que:",
        s3items: [
          'La informació facilitada és exacta, actual i completa.',
          "Té almenys 14 anys, o que el seu pare, mare o tutor ha prestat el consentiment requerit per la legislació aplicable.",
          "Mantindrà la confidencialitat de les seves credencials d'accés i és responsable de tota l'activitat realitzada amb el seu compte.",
          "Ens notificarà de manera immediata qualsevol ús no autoritzat del seu compte.",
        ],
        s3p2: "Ens reservem el dret a suspendre o cancel·lar els comptes que incompleixin aquests Termes.",
        s4intro: "Els usuaris que creen i gestionen competicions («Organitzadors») assumeixen responsabilitats addicionals:",
        s4items: [
          "Els organitzadors són els únics responsables de l'exactitud de la configuració de la competició, incloses les graduacions dels blocs, les regles de puntuació i les dades dels participants.",
          "Els organitzadors han d'obtenir els consentiments necessaris dels participants abans d'introduir les seves dades personals (nom, gènere, categoria) a la plataforma.",
          "Els organitzadors són responsables d'informar els participants sobre l'ús de les seves dades, inclosa la publicació de resultats a pàgines de classificació públiques.",
          "Els organitzadors han de complir totes les normes de la federació esportiva aplicable, els reglaments de seguretat i la legislació local vigent en organitzar esdeveniments.",
          "Ascendr és una eina de programari i no assumeix cap responsabilitat per les decisions adoptades pels organitzadors ni pel desenvolupament dels esdeveniments.",
        ],
        s5intro: "Ascendr s'ofereix amb una subscripció per esdeveniment. Els preus publicats estan en euros (€) i inclouen l'IVA aplicable.",
        s5plans: [
          ["Standard — 129 € / esdeveniment", "Fins a 300 participants. Inclou classificació en directe, puntuació flexible, analítiques, modes de puntuació per jutge i autoregistre, i paquets de capacitat addicional a 0,12 € per participant a partir de 300."],
          ["Premium — 209 € / esdeveniment", "Fins a 500 participants. Inclou totes les funcionalitats Standard més logotip de marca blanca, color d'accent personalitzat i colors de tema de marca. Excés a 0,10 € per participant a partir de 500."],
        ] as [string, string][],
        s5p2: "El pagament s'ha de realitzar abans d'activar l'estat En Directe de la competició. Ascendr utilitza un processador de pagament extern; en completar un pagament, vostè accepta també els termes d'aquest processador. Ascendr no emmagatzema les dades completes de la targeta de pagament.",
        s5refundLabel: 'Política de reemborsament:',
        s5refundText: " Els plans de competició no són reemborsables un cop la competició ha estat publicada (estat En Directe). Si experimenta un problema tècnic que impedeixi el funcionament del servei tal com es descriu, contacti'ns en un termini de 7 dies i estudiarem el cas per oferir una solució a criteri nostre.",
        s6intro: "Vostè es compromet a no fer servir Ascendr per:",
        s6items: [
          'Infringir qualsevol llei o reglament aplicable.',
          'Enviar puntuacions de competició o dades de participants falses, enganyoses o fraudulentes.',
          "Intentar accedir sense autorització a la plataforma, a altres comptes d'usuari o a la nostra infraestructura.",
          'Introduir programari maliciós, virus o qualsevol codi dissenyat per interrompre o danyar el servei.',
          'Extreure o recopilar dades de la plataforma de manera automatitzada sense el nostre consentiment per escrit.',
          'Fer servir el servei per assetjar, difamar o perjudicar qualsevol persona.',
          "Fer enginyeria inversa, descompilar o intentar extreure el codi font d'Ascendr.",
        ],
        s6p2: "Les infraccions poden comportar la suspensió immediata del compte i, si escau, accions legals.",
        s7p1: "Tots els drets de propietat intel·lectual sobre la plataforma Ascendr —inclosos el programari, el disseny, els logotips i la documentació— són i continuaran sent propietat del titular. Aquests Termes no li atorguen més drets que una llicència limitada, no exclusiva i intransferible per fer servir el servei amb la seva finalitat prevista durant la vigència de la seva subscripció.",
        s7p2: "El contingut creat pels usuaris (com ara noms de competicions, descripcions de blocs i dades de resultats) continua sent propietat de l'usuari o organitzador corresponent. En publicar contingut a la plataforma, vostè concedeix a Ascendr una llicència mundial i lliure de regalies per allotjar, reproduir i mostrar aquest contingut exclusivament amb la finalitat d'operar el servei.",
        s8p1: "En la màxima mesura permesa per la llei, Ascendr no serà responsable de cap dany indirecte, incidental, especial, conseqüent o punitiu, inclosa la pèrdua de beneficis, dades o reputació, derivat de l'ús o la impossibilitat d'ús del servei.",
        s8p2: "La responsabilitat total acumulada d'Ascendr envers vostè en relació amb qualsevol reclamació en virtut d'aquests Termes o en connexió amb ells no superarà l'import abonat per vostè pel pla de competició que va donar origen a la reclamació en els dotze mesos anteriors a la mateixa.",
        s8p3: "Res en aquests Termes limita la responsabilitat per mort o lesions personals causades per negligència, frau o declaració fraudulenta, ni qualsevol altra responsabilitat que no pugui excloure's o limitar-se en virtut de la legislació aplicable.",
        s9p1: "Pot eliminar el seu compte en qualsevol moment des de la configuració del compte. Un cop eliminat, les seves dades personals seran suprimides de conformitat amb la nostra Política de Privacitat.",
        s9p2: "Podem suspendre o cancel·lar el seu compte de manera immediata si incompleix aquests Termes, si sospitem raonablement una activitat fraudulenta o perjudicial, o si estem obligats a fer-ho per llei. Quan sigui possible, li notificarem prèviament la rescissió.",
        s9p3: "La cancel·lació del seu compte no li atorga dret a cap reemborsament de les tarifes ja abonades per una competició activa o finalitzada.",
        s10p1: "Aquests Termes i Condicions es regeixen per la legislació espanyola. En particular, se sotmeten al Reial Decret Legislatiu 1/2007, de la Llei General per a la Defensa dels Consumidors i Usuaris, en relació amb les transaccions entre empreses i consumidors.",
        s10p2: "Qualsevol controvèrsia derivada d'aquests Termes o relacionada amb ells s'intentarà resoldre primer de manera amistosa. Si no s'assoleix una solució en el termini de 30 dies, les disputes se sotmetran als jutjats i tribunals del domicili del titular, llevat que la legislació imperativa de protecció al consumidor designi un altre tribunal competent.",
        s10p3: "Els residents a la UE també poden fer servir la plataforma de Resolució de Litigis en Línia de la Comissió Europea a",
        s11p1: "Podem actualitzar aquests Termes en qualsevol moment. Els canvis substancials es notificaran als usuaris registrats per correu electrònic o mitjançant un missatge a l'aplicació amb almenys 14 dies d'antelació a la seva entrada en vigor. L'ús continuat del servei després de la data efectiva constitueix l'acceptació dels Termes actualitzats.",
        s11p2: "La versió vigent dels Termes està sempre disponible en aquesta URL. Li recomanem que desi o imprimeixi una còpia per al seu arxiu personal.",
        s12p1: "Per a qualsevol consulta sobre aquests Termes, pot contactar amb nosaltres a",
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

        {/* Acceptance */}
        <Section title={L.sections[0]}>
          <P>
            {L.body.s1p1}
          </P>
          <P>
            {L.body.s1p2}
          </P>
        </Section>

        {/* Service description */}
        <Section title={L.sections[1]}>
          <P>
            {L.body.s2intro}
          </P>
          <ul style={{ paddingLeft: 20, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {L.body.s2items.map(item => (
              <li key={item} style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
          <P>
            {L.body.s2p2}
          </P>
        </Section>

        {/* Account registration */}
        <Section title={L.sections[2]}>
          <P>
            {L.body.s3intro}
          </P>
          <ul style={{ paddingLeft: 20, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {L.body.s3items.map(item => (
              <li key={item} style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
          <P>
            {L.body.s3p2}
          </P>
        </Section>

        {/* Organiser responsibilities */}
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

        {/* Pricing */}
        <Section title={L.sections[4]}>
          <P>
            {L.body.s5intro}
          </P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
            {L.body.s5plans.map(([plan, desc]) => (
              <div key={plan} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.txt, margin: '0 0 5px' }}>{plan}</p>
                <p style={{ fontSize: 13, color: C.txtMid, lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
          <P>
            {L.body.s5p2}
          </P>
          <P>
            <strong style={{ color: C.txt }}>{L.body.s5refundLabel}</strong>{L.body.s5refundText}
          </P>
        </Section>

        {/* Acceptable use */}
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

        {/* IP */}
        <Section title={L.sections[6]}>
          <P>
            {L.body.s7p1}
          </P>
          <P>
            {L.body.s7p2}
          </P>
        </Section>

        {/* Limitation of liability */}
        <Section title={L.sections[7]}>
          <P>
            {L.body.s8p1}
          </P>
          <P>
            {L.body.s8p2}
          </P>
          <P>
            {L.body.s8p3}
          </P>
        </Section>

        {/* Termination */}
        <Section title={L.sections[8]}>
          <P>
            {L.body.s9p1}
          </P>
          <P>
            {L.body.s9p2}
          </P>
          <P>
            {L.body.s9p3}
          </P>
        </Section>

        {/* Governing law */}
        <Section title={L.sections[9]}>
          <P>
            {L.body.s10p1}
          </P>
          <P>
            {L.body.s10p2}
          </P>
          <P>
            {L.body.s10p3}{' '}
            <span style={{ color: C.accent }}>ec.europa.eu/consumers/odr</span>.
          </P>
        </Section>

        {/* Changes */}
        <Section title={L.sections[10]}>
          <P>
            {L.body.s11p1}
          </P>
          <P>
            {L.body.s11p2}
          </P>
        </Section>

        {/* Contact */}
        <Section title={L.sections[11]}>
          <P>
            {L.body.s12p1}{' '}
            <span style={{ color: C.accent }}>[contact@ascendia.app]</span>.
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
