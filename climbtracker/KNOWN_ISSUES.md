# Ascendr: problemas conocidos y arreglos pendientes

Última revisión: 2026-11-04. Evento objetivo: Open Bloc Vic 2026 (`comp-1777411314368`), 6 y 7 de noviembre.

Cómo leer cada punto: **qué falla**, **a quién afecta**, **dónde está** (archivo:línea en el código actual), **cómo arreglarlo** y **esfuerzo** (S = menos de 1 hora, M = medio día, L = más de un día).

Prioridades:

- **P1:** arreglar antes del evento. Puede fallar delante de los participantes.
- **P2:** importante, pero no bloquea el evento.
- **P3:** solo cuando actives la función afectada (contraseñas, Stripe).
- **P4:** limpieza del repositorio.

---

## P1. Antes del evento

### P1-1. Guardar los bloques puede borrar bloques de otro organizador, y sus puntuaciones

- **Qué falla:** al guardar la lista de bloques, se borran de la base de datos todos los bloques que no estén en la copia local. Las puntuaciones de esos bloques se borran con ellos.
- **A quién afecta:** a un organizador con la lista desactualizada, por ejemplo una pestaña abierta desde por la mañana, o a dos organizadores editando a la vez. Un guardado puede borrar el bloque que otro acaba de crear, con todas sus puntuaciones.
- **Dónde:** `src/lib/db.ts:306` (`upsertBoulders`, bloque "Remove only boulders that no longer exist").
- **Arreglo:** quitar el borrado físico. La app ya elimina los bloques de forma reversible (`status: 'removed'`), así que nunca hace falta borrarlos de verdad.
- **Esfuerzo:** S.

### P1-2. Cada inscripción hace que todos los conectados recarguen la lista completa de miembros

- **Qué falla:** cuando alguien se une, cada dispositivo conectado vuelve a descargar todos los miembros y sus perfiles.
- **A quién afecta:** al día de inscripciones. Con 100 personas conectadas y 300 inscripciones salen unas 30.000 consultas. La app puede ir lenta para todos.
- **Dónde:** `src/App.tsx:573` (escucha en vivo `INSERT` de `competition_members`).
- **Arreglo:** añadir solo al nuevo miembro, con los datos del aviso en vivo y pidiendo solo su perfil.
- **Esfuerzo:** S.

### P1-3. Al borrar un miembro de otra competición puede desaparecer de la tuya en pantalla

- **Qué falla:** Supabase no filtra por competición los avisos en vivo de borrado. El código quita a ese usuario de la competición activa sin comprobar de qué competición era el borrado.
- **A quién afecta:** a quien está en varias competiciones. Desaparece de la lista en pantalla hasta recargar. No se pierden datos.
- **Dónde:** `src/App.tsx:583` (escucha en vivo `DELETE` de `competition_members`).
- **Arreglo:** ignorar el aviso si `payload.old.competition_id` no es la competición activa.
- **Esfuerzo:** S.

### P1-4. El aviso de "puntuación no guardada" culpa a la conexión aunque el motivo sea otro

- **Qué falla:** si la base de datos rechaza una puntuación porque la competición está cerrada, los resultados bloqueados o el bloque es de juez, el aviso dice "revisa la conexión".
- **A quién afecta:** a los competidores al final del evento. Pensarán que les falla el móvil.
- **Dónde:** `src/App.tsx:349` (`persistCompletion`, aviso de error).
- **Arreglo:** detectar el error de permisos (código `42501` o una respuesta 403). En ese caso, decir "Esta competición ya no admite cambios" y no reintentar 6 veces.
- **Esfuerzo:** S.

### P1-5. La carga inicial falla entera si una sola consulta falla, y no avisa

- **Qué falla:** si falla cualquiera de las consultas del inicio, el usuario ve "no tienes competiciones", sin mensaje ni botón para reintentar.
- **A quién afecta:** a cualquiera con mal wifi al abrir la app.
- **Dónde:** `src/App.tsx:462` (`loadAllUserData`).
- **Arreglo:** mostrar "No se han podido cargar los datos" con un botón de reintentar, y reintentar solo una vez.
- **Esfuerzo:** S.

### P1-6. El login con Google puede quedarse en el indicador de carga para siempre

- **Qué falla:** la alternativa al login rápido de Google depende de una función que Google ya no cumple del todo (`isNotDisplayed`). No hay límite de tiempo.
- **A quién afecta:** a algunos navegadores y móviles, en el momento de inscribirse.
- **Dónde:** `src/pages/AuthPage.tsx:218`.
- **Arreglo:** si en 6 segundos no hay sesión, pasar al login por redirección (`signInWithGoogle`) y quitar el indicador de carga.
- **Esfuerzo:** S.

### P1-7. Guardar ajustes desde una pestaña antigua sobrescribe cambios más recientes

- **Qué falla:** la pantalla de ajustes copia la competición al abrirse y, al guardar, envía la competición entera.
- **A quién afecta:** a los organizadores. Un ejemplo: bloqueas los resultados en el móvil, y una pestaña del portátil abierta desde antes guarda un cambio y los desbloquea sin avisar. Lo mismo puede pasar con el aforo que ampliamos por SQL.
- **Dónde:** `src/App.tsx:1065` (`updateCompetition`) y `src/pages/SettingsPage.tsx:536-560` (copia de trabajo `draft`).
- **Arreglo:** enviar solo los campos cambiados y fusionarlos en el servidor (`data = data || cambios`) mediante una función RPC. Además, refrescar la copia de trabajo cuando llega un cambio en vivo.
- **Esfuerzo:** M.

### P1-8. Comprobaciones de operación (no son código)

- **Supabase Pro:** subir de plan unos días antes. El plan gratuito admite unas 200 conexiones en vivo y no tiene copias de seguridad.
- **Organizadores y cuentas de prueba:** revisarlos en el evento. Ahora hay organizadores jofrets y gerardacevess, y como competidores constan claravalles9 y el correo de la UOC.
- **No publicar cambios** durante la competición.
- **Esfuerzo:** S.

### P1-9. Prueba de carga realista

- **Qué falta:** la única prueba de carga insertó 50 usuarios directamente en la base de datos. Nunca se ha probado el flujo real de inscripción ni 300 personas puntuando a la vez.
- **Dónde:** `load-tests/competition_load.js` y `supabase/seed_loadtest.sql`.
- **Arreglo:** prueba con k6 contra una competición de pruebas. Debe cubrir inscripciones por `join_competition`, puntuaciones concurrentes y la página de resultados públicos. Antes, borrar los datos de prueba.
- **Esfuerzo:** M.

---

## P2. Importante, no bloquea el evento

### P2-1. Dos jueces puntuando el mismo bloque del mismo competidor se pisan
- **Qué falla:** gana el último en guardar. No hay control de versión ni aviso al otro juez.
- **Dónde:** `src/App.tsx` (`handleLogScore`) y `src/lib/db.ts` (`upsertCompletion`).
- **Arreglo:** guardar `updated_at` y rechazar el guardado si ha cambiado desde que el juez abrió la ficha, avisando "otro juez acaba de modificarla".
- **Esfuerzo:** M.

### P2-2. Los cambios de estado o género de un miembro no llegan en vivo
- **Qué falla:** la escucha en vivo de cambios en miembros ignora `status` (lista de espera o activo) y `gender`.
- **Dónde:** `src/App.tsx:576`.
- **Esfuerzo:** S.

### P2-3. La lista de espera no tiene pantalla para organizadores
- **Qué falla:** nadie puede ver ni admitir a quien está en espera. Los usuarios entran solo si vuelven a pulsar "Unirse" cuando queda sitio.
- **Dónde:** `src/pages/UsersPage.tsx` y `src/App.tsx` (`handleJoinWaitlist`).
- **Esfuerzo:** M.

### P2-4. Jueces y competidores pueden ver los emails de los demás miembros
- **Qué falla:** cada miembro descarga el email de todos los demás miembros de su competición. Es un tema de privacidad (RGPD).
- **Dónde:** `src/lib/db.ts:89` (`fetchProfiles` pide `email`) y `src/pages/UsersPage.tsx:142`.
- **Arreglo:** retirar el permiso de lectura de la columna `email` y crear una función RPC que solo devuelva emails al propietario y a los organizadores.
- **Esfuerzo:** M.

### P2-5. Un organizador puede quitar o degradar al propietario llamando directamente a la API
- **Qué falla:** la pantalla lo impide, pero la base de datos no.
- **Dónde:** `supabase/07_prelaunch_fixes.sql` (reglas `members_update` y `members_delete`).
- **Arreglo:** excluir la fila del propietario en esas dos reglas, salvo que la cambie el propio propietario.
- **Esfuerzo:** S.

### P2-6. Medallas del podio incorrectas en competiciones terminadas
- **Qué falla:** de las competiciones que no son la activa no se cargan las puntuaciones. Todos tienen 0 puntos y el oro va a los tres primeros que se inscribieron.
- **Dónde:** `src/App.tsx:866-889` (`awardTop3`).
- **Arreglo:** calcular las medallas en el servidor, o cargar las puntuaciones antes de asignarlas.
- **Esfuerzo:** M.

### P2-7. En puntuación dinámica, los competidores expulsados siguen restando puntos
- **Qué falla:** el reparto del bote cuenta los tops de todas las puntuaciones, también las de miembros eliminados.
- **Dónde:** `src/utils/scoring.ts:86` (`calcDynamicPointsForBoulder`). También afecta a los puntos por bloque en `BouldersPage`, `JudgingPage` y `EventProfilePage`.
- **Arreglo:** filtrar las puntuaciones por competidores activos antes de calcular, en todos los sitios.
- **Esfuerzo:** S.

### P2-8. Rendimiento del cálculo de puntos en la pantalla del juez
- **Qué falla:** con 300 competidores, cada tarjeta recalcula los puntos. En modo dinámico puede ralentizar los móviles.
- **Dónde:** `src/pages/JudgingPage.tsx:24` y el cálculo de medallas en `src/App.tsx:889`.
- **Arreglo:** calcular una vez por cambio con `useMemo` y pasar el resultado a las tarjetas.
- **Esfuerzo:** S.

### P2-9. Sin registro de intentos, cada top cuenta como flash
- **Qué falla:** si el registro de intentos está desactivado, cada top se guarda con 1 intento y suma el bonus de flash.
- **Dónde:** `src/utils/scoring.ts:137` y `src/components/BoulderCard.tsx` (`attemptTracking`).
- **Arreglo:** no dar el bonus de flash cuando el registro de intentos está desactivado.
- **Esfuerzo:** S.

### P2-10. La página de reglas no explica el desempate
- **Qué falla:** el orden real es puntos, después tops, después zonas y después quién se inscribió antes. No aparece en ningún sitio.
- **Dónde:** `src/pages/RulesPage.tsx`.
- **Esfuerzo:** S.

### P2-11. Los resultados públicos de cualquier competición se ven sabiendo su identificador
- **Qué falla:** también los de competiciones privadas o en borrador. El identificador es una marca de tiempo, así que se puede adivinar.
- **Dónde:** `supabase/07_prelaunch_fixes.sql:414` (`get_public_leaderboard`).
- **Arreglo:** devolver resultados solo si la competición está LIVE o FINISHED, o si tiene activada una opción "resultados públicos".
- **Esfuerzo:** S.

### P2-12. No hay monitorización de errores en producción
- **Qué falla:** los errores de los usuarios solo quedan en la consola de su navegador. No te enteras si algo falla durante el evento.
- **Arreglo:** añadir Sentry, que tiene plan gratuito, o como mínimo enviar los errores capturados por `ErrorBoundary` a un registro.
- **Esfuerzo:** S.

### P2-13. El ranking muestra 300 filas sin paginar
- **Qué falla:** en móviles antiguos el ranking puede ir lento.
- **Dónde:** `src/pages/LeaderboardPage.tsx:445`.
- **Arreglo:** paginar o virtualizar la lista. Ya existe `src/hooks/usePagination.ts`.
- **Esfuerzo:** S.

---

## P3. Cuando actives la función afectada

### P3-1. Contraseña de acceso en texto plano
- **Qué falla:** se guarda dentro de `competitions.data`. La pueden leer los miembros y cualquier usuario con sesión en competiciones públicas, y viaja en los avisos en vivo.
- **Dónde:** `src/pages/SettingsPage.tsx:875`.
- **Arreglo:** moverla a una tabla aparte, visible solo para el propietario y guardada con hash, y comprobarla dentro de `join_competition`.
- **Esfuerzo:** M.

### P3-2. Stripe: el aforo pagado se calcula mal
- **Qué falla:** al pagar, el límite queda fijado en el número de inscritos de ese momento (por ejemplo, 0) y no en 300 o 500.
- **Dónde:** `supabase/02_payment_rpc.sql:110`, `api/stripe-webhook.ts` y `api/verify-payment.ts` (`Number(x) || 0`).
- **Esfuerzo:** S.

### P3-3. Cualquier código promocional de 6 o más caracteres da 100 plazas gratis
- **Qué falla:** se valida solo en el navegador y se puede repetir.
- **Dónde:** `src/pages/SettingsPage.tsx:163-172`.
- **Arreglo:** validar los códigos en el servidor, con una tabla de códigos de un solo uso.
- **Esfuerzo:** M.

### P3-4. Publicar como LIVE y los límites de aforo solo se controlan en el navegador
- **Qué falla:** el propietario puede poner `status = LIVE` o cambiar `participantLimit` llamando directamente a la API, sin pagar.
- **Dónde:** `src/App.tsx:1096` y las reglas de `competitions` en `01_security_fixes.sql` y `07`.
- **Arreglo:** un disparador que solo permita cambiar estos campos desde `apply_purchase`.
- **Esfuerzo:** M.

### P3-5. El formulario de cambio de contraseña es inaccesible
- **Qué falla:** el enlace de recuperación inicia sesión, pero nunca muestra el formulario para cambiar la contraseña.
- **Dónde:** `src/App.tsx` (falta gestionar el evento `PASSWORD_RECOVERY`).
- **Esfuerzo:** S.

### P3-6. Posible fallo al volver del login de Google
- **Qué falla:** el código que limpia `?code=` de la URL puede adelantarse al intercambio de la sesión y dejar al usuario sin iniciar sesión.
- **Dónde:** `src/App.tsx:192`.
- **Esfuerzo:** S.

### P3-7. Configuración de seguridad que hay que ajustar
- **API:** acepta peticiones desde cualquier dominio `*.vercel.app`. Está en `api/_auth.ts:20`.
- **Formulario de contacto:** no limita el número de envíos, y reCAPTCHA solo se aplica si está configurado. Está en `api/contact.ts:50`.
- **Supabase:** la redirección `https://*.vercel.app/**` deja recibir logins en cualquier web de Vercel. Hay que cambiarla por el patrón del proyecto.
- **Google Cloud:** quitar el origen de la dirección de prueba `...git-fix-pre-launch...`.
- **Esfuerzo:** S.

---

## P4. Limpieza del repositorio

- **`node_modules` en la raíz.** Están subidos al repositorio, junto con un `package.json` suelto en la raíz. Hay que borrarlos y añadirlos a `.gitignore`.
- **Vercel publica sin comprobar tipos.** Compila con `vite build` sin `tsc`, y hay errores de tipos en `src/components/PlexusCanvas.tsx:38`. Hay que corregirlos y usar `npm run build` en Vercel.
- **Avisos de lint.** Hay 114 avisos, casi todos por usar `any`. No es urgente.
- **Pruebas de SQL fuera del repo.** Las 79 pruebas de la base de datos, hechas con PGlite, solo existen en local. Hay que añadirlas a `supabase/tests/` para poder repetirlas antes de cada migración.
- **Restos de hoy.** Borrar la rama `fix/pre-launch`, que ya está fusionada, y la carpeta antigua e ilegible `Documents/GitHub/climbTracker`.

---

## Resuelto el 2026-11-04 (para referencia)

Migraciones aplicadas en producción, en este orden: **07, 08, 09, 10 y 11**.

- **Seguridad.** Las reglas que comparaban una columna consigo misma permitían que cualquier organizador o juez de cualquier competición escribiera en todas. Ya están corregidas. Además:
  - Los perfiles y los emails ya no son públicos.
  - Los pagos son de solo lectura.
  - No se puede leer nada sin sesión.
- **Inscripción.** Hecha en el servidor con `join_competition`:
  - Las invitaciones a competiciones privadas funcionan.
  - La contraseña, los bloqueos y el aforo se aplican de verdad.
  - Los dorsales son únicos.
  - El rol de competidor queda garantizado.
  - El campo del código acepta los 10 caracteres.
- **Puntuación.**
  - Paginación para superar el límite de 1.000 filas.
  - Los bloques eliminados no puntúan.
  - Editar un dorsal o un rol no borra la categoría.
  - El bote dinámico se aplica a todos los bloques.
  - Las reglas de autopuntuación se aplican en la base de datos.
- **Robustez.**
  - Las puntuaciones se guardan en orden, con reintentos y con un aviso concreto cuando fallan.
  - El juez no pierde lo que está introduciendo.
  - La app se resincroniza al reconectar.
  - Pantalla de error con recarga automática tras publicar.
  - Los resultados públicos siempre salen del servidor.
- **Experiencia de uso.**
  - Aviso en los navegadores internos de Instagram, Facebook y TikTok.
  - El ranking aparece al instante.
  - Botón "Accedir / Acceder / Enter".
- **Dependencias.** 0 vulnerabilidades en producción.
