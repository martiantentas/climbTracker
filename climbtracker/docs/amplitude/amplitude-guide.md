# Amplitude en Ascendr: guía de instalación y de etiquetado

Esta guía explica cómo medir el producto de Ascendr con Amplitude. La lectura completa lleva unos 15 minutos. Los pasos prácticos están en la sección 5.

Hay tres archivos en esta carpeta:

- [ascendr-tracking-plan.xlsx](ascendr-tracking-plan.xlsx): qué se mide. Eventos, propiedades y cuándo se disparan.
- [ascendr-gtm-container.json](ascendr-gtm-container.json): el contenedor listo para importar en Google Tag Manager.
- Esta guía: el cómo y el porqué.

## 1. Qué vamos a hacer, en una frase

Vamos a medir solo la parte de Ascendr con sesión iniciada, con un único tag de Amplitude dentro de Google Tag Manager (GTM), y ese tag solo se activará cuando la persona acepte las cookies de analítica.

El código de la app no habla con Amplitude. Solo deja mensajes en una lista compartida, y GTM los recoge y los reenvía. Así, la privacidad y las claves viven en un solo sitio.

La landing, los textos legales y la demo se siguen midiendo con GA4. No se envían a Amplitude.

## 2. Glosario mínimo

Estos términos aparecen en toda la guía. Léelos una vez.

| Término | Qué significa |
|---|---|
| Evento | Algo que hizo una persona, con nombre y hora. Ejemplo: `Competition Created`. |
| Propiedad de evento | Un dato que describe ese evento concreto. Ejemplo: `competition id`. |
| Propiedad de usuario | Un dato que describe a la persona y que se guarda en su perfil. Ejemplo: `language`. |
| User id | El identificador de la persona. Lo ponemos nosotros. Será el id de usuario de Supabase. |
| Device id | Identificador que Amplitude asigna al navegador. Existe aunque nadie haya iniciado sesión. |
| dataLayer | Una lista en la página donde la app deja mensajes para GTM. Ya la usas para GA4. |
| GTM | Google Tag Manager. Lee el dataLayer y decide qué herramientas se activan. |
| Tag, trigger, variable | En GTM, el tag es lo que se ejecuta. El trigger dice cuándo. La variable guarda un dato que el tag necesita. |
| Proyecto de Amplitude | Un espacio de datos separado. Tendremos uno de pruebas (dev) y otro real (prod). |
| MTU | Usuarios mensuales únicos. Amplitude cobra por ellos y cuenta también a los visitantes anónimos. |
| Plan de etiquetado | La tabla que fija qué eventos existen, cuándo se disparan y con qué propiedades. |

## 3. Cómo viaja un evento

Un evento hace este recorrido, siempre en el mismo orden:

1. La persona hace algo en la app. Por ejemplo, crea una competición.
2. El código comprueba que hay consentimiento guardado. Si no lo hay, el recorrido termina aquí y no sale nada.
3. El código deja un mensaje en el dataLayer.
4. GTM ve el mensaje y comprueba otra vez que la persona aceptó las cookies de analítica.
5. Si las aceptó, el tag de GTM llama a Amplitude con el nombre del evento y sus propiedades.
6. El evento aparece en Amplitude pocos segundos después.

### El contrato de mensajes

El código solo usa tres tipos de mensaje. Es el único acuerdo entre la app y GTM.

```js
// Un evento del plan
{ event: 'amplitude_event',
  amp_payload: '{"name":"Competition Created","props":{"competition id":"comp-123"},"insertId":"opcional"}' }

// Identificar a la persona (al cargar la app con sesión)
{ event: 'amplitude_identify',
  amp_payload: '{"userId":"<id de Supabase>","props":{"language":"es","is organizer":true}}' }

// Olvidar a la persona (al cerrar sesión)
{ event: 'amplitude_reset' }
```

Los datos van dentro de una sola cadena de texto (`amp_payload`) por un motivo concreto. GTM fusiona los objetos que se dejan en el dataLayer y conserva los valores anteriores. Con objetos normales, las propiedades de un evento se filtrarían al siguiente, y un `insert id` viejo haría que Amplitude descartara eventos válidos. Una cadena de texto se sustituye entera cada vez.

Con este contrato, añadir un evento nuevo solo requiere código. No hay que tocar GTM.

## 4. Decisiones tomadas

Cada decisión lleva su motivo, para que puedas cambiarla con criterio.

| Decisión | Motivo |
|---|---|
| Cuenta de Amplitude en la región de la UE. | Los datos de personas de la UE se guardan en la UE. La región se elige al crear la cuenta. |
| No pegar el snippet de Amplitude en `index.html`. | Ese snippet arranca al cargar la página, antes de que la persona elija sobre las cookies. Eso incumple tu propio banner de consentimiento. |
| `autocapture` desactivado. | Autocapture envía clics, formularios y descargas sin que los hayamos definido. Con un plan de etiquetado queremos solo lo que decidimos medir. |
| Session Replay desactivado, y por eso no se usa el snippet de instalación de Amplitude. | Ese snippet (`cdn.amplitude.com/script/CLAVE.js`) carga también Session Replay y pide ajustes remotos. Replay graba la pantalla, con nombres y dorsales. Cargamos solo la librería de analítica, con la versión fijada y verificada por hash. |
| Page views desde el `page_view` que ya existe. | La app usa rutas con `#`. Una sola fuente evita eventos duplicados. |
| Solo producto con login. | Cada visitante anónimo cuenta como usuario mensual. La landing ya está cubierta por GA4. |
| Dos proyectos: dev y prod. | Así las pruebas no ensucian los datos reales. GTM elige la clave según el dominio. |
| Identidad por id de Supabase. | Es estable y no es un dato personal. Nunca usar correo ni nombre. |
| Eventos en Title Case y en pasado. Propiedades en minúsculas con espacios. | Es la convención que recomienda Amplitude. Lo importante es aplicar una sola y no mezclar. |
| Nunca un evento por pantalla ni por botón. | `Skip Button Clicked` describe la interfaz. Un evento debe describir lo que hizo la persona. |
| Doble barrera de consentimiento. | El código no envía sin consentimiento guardado, y GTM tampoco dispara sin él. Si falla una, la otra protege. |

## 5. Paso a paso

### 5.1 Amplitude: cuenta de la UE y proyectos

Tu cuenta actual es de EE. UU. (`app.amplitude.com`). La región de datos se elige al crear la cuenta, y no he encontrado ninguna forma de cambiarla en una cuenta existente. Como todavía no has enviado datos, lo más simple es crear una cuenta nueva y no perder nada.

1. Crea una cuenta nueva en Amplitude y elige la región de la UE durante el registro. Después, la dirección de la app empezará por `app.eu.amplitude.com`.
2. No uses la clave del snippet que tenías. Es de la cuenta de EE. UU. y no funciona con la región de la UE.
3. Cambia el nombre del proyecto que se crea solo a `ascendr-dev` y crea otro llamado `ascendr-prod`.
4. Anota la clave API de cada uno (Settings, Projects). La clave de un navegador es pública por diseño. Aun así, no la pegues en el código: irá solo en GTM.
5. En ambos proyectos pon la misma zona horaria de informes.
6. Ignora el snippet de instalación que te muestra Amplitude. No lo uses: el contenedor de GTM ya carga lo necesario, y ese snippet añade Session Replay.

Hacen falta dos cosas a la vez para estar en la UE: la clave de un proyecto de la UE y `serverZone: 'EU'` al arrancar. El contenedor ya incluye lo segundo.

### 5.2 GTM: importar el contenedor

1. En GTM, abre el contenedor `GTM-NJBNLZ9K`. Ve a Administrar, Importar contenedor.
2. Elige el archivo `ascendr-gtm-container.json`.
3. En el espacio de trabajo, elige Nuevo y llámalo `Amplitude`. Así puedes revisar los cambios antes de mezclarlos.
4. En la opción de importación, elige **Combinar** y marca "Cambiar el nombre de las etiquetas, activadores y variables en conflicto". No elijas nunca Sobrescribir: borraría tus tags de GA4.
5. Confirma. GTM te enseña un resumen: 3 tags, 3 triggers y 3 variables nuevos, más dos variables integradas (`Event` y `Page Hostname`).
6. Abre la variable `Amplitude API key`. Cambia el valor por defecto (`REPLACE_WITH_EU_DEV_API_KEY`) por la clave del proyecto dev. En las dos filas de la tabla, cambia `REPLACE_WITH_EU_PROD_API_KEY` por la clave del proyecto prod.
7. No publiques todavía. Haz primero la prueba de la sección 5.4.

**Qué contiene el contenedor.** Todo lo demás se explica solo con esta tabla.

| Elemento | Qué hace |
|---|---|
| Variable `Amplitude API key` | Elige la clave según el dominio. `ascendr.top` y `www.ascendr.top` usan la de prod. Cualquier otro (localhost, previews de Vercel) usa la de dev. |
| Variables `DLV - amp_payload` y `DLV - analytics_consent` | Leen del dataLayer el mensaje y la decisión de cookies. |
| Tag `Amplitude - Init` | Carga solo la librería de analítica (versión 2.42.4, desde el servidor de la UE y con comprobación de hash) y la arranca con la región de la UE, sin autocapture y sin ajustes remotos. Se dispara una vez por página, solo con consentimiento. |
| Tag `Amplitude - Dispatcher` | Es el único que envía datos. Reenvía los tres tipos de mensaje de la app. Exige consentimiento. |
| Tag `Amplitude - Opt out` | Apaga Amplitude si la persona retira el consentimiento. No exige consentimiento, porque solo detiene el seguimiento. |
| Trigger `CE - cookie_consent_update granted` | Se activa cuando el banner informa de que se aceptaron las cookies. El banner lo envía en cada carga, también para quien aceptó en una visita anterior. |
| Trigger `CE - cookie_consent_update denied` | Se activa cuando se rechazan o se retiran. |
| Trigger `CE - amplitude messages` | Se activa con `amplitude_event`, `amplitude_identify` o `amplitude_reset`. |

**Si tienes que editar un tag a mano.** Abre el tag, borra todo el contenido del campo HTML y pega solo el contenido de [gtm-init-tag.html](gtm-init-tag.html). Es HTML normal, de `<script>` a `</script>`. No pegues nunca el archivo `.json` en un tag: es el archivo de importación y GTM no puede publicarlo como HTML.

Mientras la variable `Amplitude API key` tenga los valores de ejemplo, `Amplitude - Init` no carga nada y avisa por consola. Es una protección para que un olvido no envíe datos a ninguna parte.

### 5.3 Código

El código ya está hecho. Vive en `src/lib/analytics.ts` y tiene cuatro funciones: `track` (enviar un evento), `identify` (identificar a la persona), `resetIdentity` (olvidarla al cerrar sesión) y `setAnalyticsContext` (fijar las propiedades que llevan todos los eventos).

El helper tiene una segunda barrera de privacidad. Si no hay un consentimiento `accepted` guardado en el navegador, no deja ningún mensaje en el dataLayer. Tampoco guarda la marca temporal de login (`ascendr_login_intent`), porque solo sirve para analítica. Si la persona acepta después, el helper reenvía su identidad, porque GTM no repite los mensajes que bloqueó.

Los eventos P1 del plan ya se envían desde estos puntos: `App.tsx` (registro, login, logout, crear competición, unirse, bloque puntuado, compra), `AuthPage.tsx` (marca de login activo) y `PaymentModal.tsx` (inicio de pago). Hasta que importes el contenedor de GTM, no llega nada a Amplitude.

Los eventos de GA4 que ya existen (`purchase`, `begin_checkout`, `boulder_scored`, `settings_saved`) no cambian. Cada uno envía además su versión a Amplitude, con el nombre del plan.

### 5.4 Comprobación antes de publicar

Haz esta prueba con el proyecto dev, en GTM con el modo Vista previa. Repítela con cada evento nuevo.

1. Abre la web en una ventana privada, sin haber aceptado cookies. En la pestaña Network no debe haber ninguna petición a Amplitude. En Application, Session Storage, no debe existir la clave `ascendr_login_intent`.
2. Pulsa Rechazar. Sigue sin haber peticiones.
3. Recarga, pulsa Aceptar e inicia sesión. En Vista previa debe dispararse `Amplitude - Init` una sola vez.
4. En Network, las peticiones de eventos deben ir a `api.eu.amplitude.com` y deben responder 200. Si responden 400 con "Invalid API key", la clave no pertenece a un proyecto de la UE. El único archivo de Amplitude que se descarga es `analytics-browser-2.42.4-min.js.gz`.
5. En Amplitude, abre User Lookup y busca tu user id. Debe aparecer tu perfil con las propiedades de usuario.
6. Crea una competición de prueba. En Event Explorer debe aparecer `Competition Created` con sus propiedades.
7. Haz dos acciones seguidas con propiedades distintas, por ejemplo guardar un bloque y volver a iniciar sesión. El segundo evento no debe llevar las propiedades del primero.
8. Comprueba que no llegan eventos que no definimos, como `[Amplitude] Element Clicked`. Si llegan, el autocapture sigue activo en el proyecto. Desactívalo en su configuración.
9. Comprueba en Network que no aparece ninguna petición a `sr-client-cfg` ni un archivo `plugin-session-replay`, y que la pestaña Replay de Amplitude está vacía.
10. Cierra sesión. En el siguiente evento el user id debe haber desaparecido.
11. Vuelve a abrir las preferencias de cookies, pulsa Rechazar y haz otra acción. No debe llegar ningún evento nuevo.
12. Recarga justo después de una compra de prueba. `Purchase Completed` no debe duplicarse.
13. Con un bloqueador de anuncios activo, anota cuántos eventos se pierden. Es normal que se pierda una parte.

### 5.5 Publicar

1. Cuando todo lo anterior pase, pulsa Enviar en GTM y publica el contenedor.
2. Comprueba una vez en `ascendr.top` que los eventos llegan al proyecto prod y no al dev.
3. Durante la primera semana, revisa a diario la lista de eventos de Amplitude. Todo lo que no esté en el plan es un error.

## 6. Privacidad

La política de privacidad ya está actualizada en los tres idiomas (versión de noviembre de 2026) en [PrivacyPolicyPage.tsx](../../src/pages/PrivacyPolicyPage.tsx). Ahora dice lo siguiente:

- Amplitude mide el uso de la aplicación una vez iniciada la sesión. Google Analytics 4 mide el sitio web.
- Solo recibe datos con consentimiento, que se puede retirar en cualquier momento.
- Los datos se guardan en la región europea de Amplitude, y Amplitude, Inc. los trata por encargo de Ascendr.
- Los eventos se asocian a un identificador aleatorio, no al nombre ni al correo.
- La cookie `AMP_*` guarda un identificador de dispositivo, el de usuario y la sesión, durante 1 año.
- Si alguien pide borrar su cuenta, también se envía una solicitud de borrado a Amplitude.

Esto no es asesoramiento legal. Antes de publicar, comprueba estos puntos, porque la política afirma cosas que tienen que ser ciertas:

1. **Acuerdo de tratamiento de datos.** Revisa el acuerdo (DPA) de Amplitude y acéptalo si tu cuenta lo requiere. La política habla de garantías adecuadas para accesos desde fuera del Espacio Económico Europeo, y eso lo respalda ese acuerdo.
2. **Borrados.** La política promete que se borra también en Amplitude. Cuando llegue una petición, usa la API de privacidad de Amplitude (tarda hasta 30 días) y llama a `setOptOut`, porque borrar no detiene el seguimiento futuro. Anota el proceso en tu registro de solicitudes.
3. **Dirección IP.** Por defecto, Amplitude recibe la IP y la usa para deducir una ubicación aproximada. La política lo cuenta así. Si prefieres no recibirla, se desactiva al arrancar el SDK, y entonces hay que quitar esa frase de la política.
4. **Nombre exacto de la cookie.** Comprueba en la pestaña Application del navegador que empieza por `AMP_`, como dice la política.
5. **Conservación.** La política dice que los datos se conservan mientras la cuenta esté activa. Amplitude no borra datos antiguos por sí solo, así que si quieres un plazo fijo habrá que configurarlo y cambiar el texto.

Reglas de datos que no se negocian:

- No enviar correo, nombre, teléfono ni texto libre.
- No enviar el título ni el texto de los avisos.
- Las propiedades solo llevan identificadores, categorías cerradas, números y booleanos.

## 7. Mantenimiento

Para añadir un evento nuevo:

1. Añade una fila al plan de etiquetado, con su prioridad y su momento exacto de disparo.
2. Añade la llamada en el código, con el nombre exacto del plan.
3. Pruébalo con el proyecto dev. No hace falta tocar GTM.

Para actualizar la versión de la librería de Amplitude:

1. Cambia el número de versión en la dirección del tag `Amplitude - Init` y comprueba que existe en el servidor de la UE.
2. Calcula el hash nuevo con este comando, cambiando la versión: `curl -s --compressed https://cdn.eu.amplitude.com/libs/analytics-browser-VERSION-min.js.gz | openssl dgst -sha384 -binary | openssl base64 -A`
3. Pon el resultado en el tag, precedido de `sha384-`.
4. Si el hash no coincide, el navegador bloquea la librería y no se mide nada. Es una protección a propósito.

Reglas que evitan que los datos se ensucien:

- El nombre exacto importa. `Song Played` y `song played` son dos eventos distintos.
- Renombrar un evento en Amplitude solo cambia el nombre que se ve. El nombre real que llega del código no cambia.
- Un cambio en una propiedad de usuario no es retroactivo. Los eventos antiguos conservan el valor viejo.
- Revisa el plan una vez por versión importante y borra lo que nadie use.

## 8. Decisiones abiertas

- **Resultados públicos.** Se dejan fuera por ahora. Si quieres medir al público de una competición, hay que medir su coste en usuarios mensuales antes.
- **Session Replay.** Queda fuera hasta decidir su tratamiento de privacidad y cuánto se graba.
- **Ingresos.** `Purchase Completed` no lleva el importe, porque no está en el navegador. Se puede añadir desde la respuesta del servidor si lo necesitas en Amplitude.
- **Dirección IP.** Decide si quieres que Amplitude la reciba (punto 3 de la sección 6).
