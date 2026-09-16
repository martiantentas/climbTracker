/**
 * k6 load test — Ascendr competition scoring
 *
 * Simula N jutges/competidors marcant boulders simultàniament
 * amb connexió Supabase Realtime WebSocket.
 *
 * Instal·la: brew install k6
 * Executa:   k6 run --vus 50 --duration 3m competition_load.js
 *
 * Prerequisits:
 *  1. seed_loadtest.sql executat al SQL Editor de Supabase
 *  2. Variables d'entorn configurades (vegeu baix)
 */

import http     from 'k6/http'
import ws       from 'k6/ws'
import encoding from 'k6/encoding'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// ── Configuració ─────────────────────────────────────────────
const SUPABASE_URL  = __ENV.SUPABASE_URL  || 'https://YOUR-PROJECT.supabase.co'
const ANON_KEY      = __ENV.SUPABASE_ANON_KEY || 'YOUR-ANON-KEY'
const COMP_ID       = __ENV.COMP_ID       || 'comp-1777411314368'
const NUM_BOULDERS  = parseInt(__ENV.NUM_BOULDERS  || '10')
const TEST_PASSWORD = 'LoadTest123!'

// ── Mètriques personalitzades ─────────────────────────────────
const writeErrors   = new Rate('score_write_errors')
const writeLatency  = new Trend('score_write_latency_ms', true)
const wsConnected   = new Rate('ws_connected')

// ── Escenaris ─────────────────────────────────────────────────
export const options = {
  scenarios: {
    scoring_load: {
      executor:    'ramping-vus',
      startVUs:    0,
      stages: [
        { duration: '30s', target: 50  }, // puja a 50 VUs
        { duration: '1m',  target: 100 }, // puja a 100 VUs
        { duration: '1m',  target: 200 }, // puja a 200 VUs — límit free tier WS
        { duration: '2m',  target: 200 }, // manté 200 VUs (estrès real)
        { duration: '30s', target: 0   }, // baixa
      ],
    },
  },
  thresholds: {
    score_write_errors:     ['rate < 0.01'],  // < 1% errors d'escriptura
    score_write_latency_ms: ['p(95) < 2000'], // 95% < 2s
    ws_connected:           ['rate > 0.95'],  // > 95% connexions WS OK
    http_req_failed:        ['rate < 0.05'],  // < 5% errors HTTP globals
  },
}

// ── Setup: login d'un únic usuari de test ────────────────────
// Crea l'usuari manualment a Supabase Dashboard > Authentication > Add user
// i passa les credencials via variables d'entorn:
//   -e TEST_EMAIL=loadtest@ascendr-test.invalid
//   -e TEST_PASSWORD=LoadTest123!
// Tots els VUs comparteixen el mateix token (el test mesura
// concurrència de WS i escriptures, no unicitat d'auth).

export function setup() {
  const email    = __ENV.TEST_EMAIL    || 'loadtest@ascendr-test.invalid'
  const password = __ENV.TEST_PASSWORD || TEST_PASSWORD

  const res = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email, password }),
    { headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' } }
  )

  const ok = check(res, { 'login ok': r => r.status === 200 })
  if (!ok) {
    console.error(`Login failed: ${res.status} ${res.body}`)
    return { tokens: [] }
  }

  const token = res.json('access_token')

  // Extreu el UUID de l'usuari del JWT (claim 'sub')
  const jwtPayload = JSON.parse(
    encoding.b64decode(token.split('.')[1], 'rawstd', 's')
  )
  const userId = jwtPayload.sub
  console.log(`Setup: token OK, userId=${userId}`)

  return { tokens: Array(10).fill(token), userId }
}

// ── Test principal ────────────────────────────────────────────
export default function (data) {
  // Cada VU agafa el seu token per índex (VU ids comencen a 1)
  const vuIndex = (__VU - 1) % data.tokens.length
  const jwt = data.tokens[vuIndex]
  if (!jwt) {
    console.warn(`VU ${__VU}: no token available, skipping`)
    sleep(5)
    return
  }

  const authHeaders = {
    'apikey':        ANON_KEY,
    'Authorization': `Bearer ${jwt}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=minimal',
  }

  // ── Connexió WebSocket Realtime ──────────────────────────
  const wsUrl = SUPABASE_URL.replace('https://', 'wss://') +
    `/realtime/v1/websocket?apikey=${ANON_KEY}&vsn=1.0.0`

  let wsOk = false
  const wsSession = ws.connect(wsUrl, { headers: { Authorization: `Bearer ${jwt}` } }, (socket) => {
    wsOk = true

    // Subscripció al canal de la competició
    socket.on('open', () => {
      socket.send(JSON.stringify({
        topic:   `realtime:public:completions:competition_id=eq.${COMP_ID}`,
        event:   'phx_join',
        payload: {},
        ref:     '1',
      }))
    })

    socket.on('message', (msg) => {
      // Mantenir la connexió activa (heartbeat Phoenix)
      try {
        const data = JSON.parse(msg)
        if (data.event === 'phx_reply' && data.payload?.status === 'ok') {
          // Canal subscrit correctament
        }
      } catch (_) { /* ignore parse errors */ }
    })

    // Mantenir WS obert 10-30s (simula un jutge puntejant)
    socket.setTimeout(() => socket.close(), randomInt(10000, 30000))
  })

  wsConnected.add(wsOk)

  // ── Escriptures de puntuació ──────────────────────────────
  // Simula 3-8 marcatges durant la sessió del VU
  const numScores = randomInt(3, 8)
  for (let s = 0; s < numScores; s++) {
    const boulderId    = `boulder-test-${randomInt(1, NUM_BOULDERS)}`
    const attempts     = randomInt(1, 5)
    const isTop        = Math.random() > 0.5
    const hasZone      = Math.random() > 0.3
    const competitorId = data.userId  // UUID real extret del JWT

    const payload = {
      competition_id: COMP_ID,
      competitor_id:  competitorId,
      boulder_id:     boulderId,
      data: {
        competitorId:  competitorId,
        boulderId:     boulderId,
        attempts:      attempts,
        timestamp:     Date.now(),
        hasZone:       hasZone,
        zoneAttempts:  hasZone ? randomInt(1, 3) : 0,
        zonesReached:  hasZone ? 1 : 0,
        topValidated:  isTop,
      },
      updated_at: new Date().toISOString(),
    }

    const start = Date.now()
    const res = http.post(
      `${SUPABASE_URL}/rest/v1/completions`,
      JSON.stringify(payload),
      {
        headers: {
          ...authHeaders,
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
      }
    )
    const elapsed = Date.now() - start

    writeLatency.add(elapsed)
    const ok = check(res, {
      'score write 2xx': r => r.status >= 200 && r.status < 300,
    })
    writeErrors.add(!ok)

    if (!ok) {
      console.error(`Score write failed: ${res.status} ${res.body.substring(0, 200)}`)
    }

    // Espera entre 2 i 8 segons entre marcatges (comportament real)
    sleep(randomInt(2, 8))
  }
}

// ── Teardown: mostra resum ────────────────────────────────────
export function teardown(data) {
  console.log('Load test finalitzat.')
  console.log('Recorda executar cleanup_loadtest.sql per netejar les dades de prova.')
}

// ── Helpers ───────────────────────────────────────────────────
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
