/**
 * Ascendr load test (k6): a realistic competition day, against a TEST
 * competition only (comp-loadtest, created by 01_seed.sql). The competition id
 * is hard-coded on purpose: this script can never touch the real event.
 *
 * What each virtual user does (mirrors the app's real network traffic):
 *   competitors  arrive spread over ARRIVAL seconds, log in, open the invite
 *                link, join through join_competition, load the app data,
 *                open the realtime channels, and then score boulders. Every
 *                few minutes their phone "locks": the websocket drops and,
 *                on unlock, the app resyncs everything (the heaviest read).
 *                Now and then they try to self-score a judge-only boulder,
 *                which the database must refuse.
 *   judges       validate judge-only boulders for random competitors.
 *   viewers      anonymous public results page, polling every 30 s.
 *
 * Run (from climbtracker/load-tests):
 *   k6 run -e SUPABASE_URL=https://xxxx.supabase.co -e SUPABASE_ANON_KEY=... ascendr_load.js
 * Smoke test first (2 minutes, a handful of users):
 *   k6 run -e SMOKE=1 -e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... ascendr_load.js
 *
 * Knobs (env): COMPETITORS (300, max 400) JUDGES (10) VIEWERS (50)
 *   ARRIVAL (360 s) STEADY (600 s) WRITE_EVERY (60 s, mean per competitor)
 *   LOCK_EVERY (180 s, mean) JUDGE_EVERY (15 s, mean per judge)
 */

import http from 'k6/http'
import { WebSocket } from 'k6/websockets'
import { setTimeout, clearTimeout, setInterval, clearInterval } from 'k6/timers'
import { sleep } from 'k6'
import exec from 'k6/execution'
import { Rate, Trend, Counter } from 'k6/metrics'

// ── Configuration ────────────────────────────────────────────────────────────
const URL      = (__ENV.SUPABASE_URL || '').replace(/\/+$/, '')
const ANON     = __ENV.SUPABASE_ANON_KEY || ''
const WS_URL   = URL.replace(/^http/, 'ws') + `/realtime/v1/websocket?apikey=${ANON}&vsn=1.0.0`
const COMP     = 'comp-loadtest'              // never the real event
const INVITE   = 'LOADTEST'
const PASSWORD = 'LoadTest-2026!'
const DOMAIN   = '@ascendr-loadtest.invalid'
const PAGE     = 1000                          // same page size as the app

const SMOKE       = __ENV.SMOKE === '1'
const num         = (k, d) => (__ENV[k] !== undefined ? Number(__ENV[k]) : d)
const N_COMP      = Math.min(400, num('COMPETITORS', SMOKE ? 5 : 300))
const N_JUDGE     = Math.min(10,  num('JUDGES',      SMOKE ? 1 : 10))
const N_VIEW      = num('VIEWERS',     SMOKE ? 2 : 50)
const ARRIVAL     = num('ARRIVAL',     SMOKE ? 20 : 360)
const STEADY      = num('STEADY',      SMOKE ? 100 : 600)
const WRITE_EVERY = num('WRITE_EVERY', SMOKE ? 10 : 60)
const LOCK_EVERY  = num('LOCK_EVERY',  SMOKE ? 40 : 180)
const JUDGE_EVERY = num('JUDGE_EVERY', SMOKE ? 8 : 15)
const TOTAL       = ARRIVAL + STEADY
const BEARER_ANON = ANON.startsWith('eyJ')     // legacy anon JWT; new publishable keys go in apikey only

if (!/^https:\/\/.+/.test(URL) || !ANON) {
  throw new Error('Set -e SUPABASE_URL=https://<project>.supabase.co and -e SUPABASE_ANON_KEY=<anon key>')
}

// ── Metrics ──────────────────────────────────────────────────────────────────
const loginOk      = new Rate('login_ok')
const loginMs      = new Trend('login_ms', true)
const login429     = new Counter('login_rate_limited')
const joinOk       = new Rate('join_ok')
const joinMs       = new Trend('join_ms', true)
const loadOk       = new Rate('initial_load_ok')
const loadMs       = new Trend('initial_load_ms', true)
const resyncOk     = new Rate('resync_ok')
const resyncMs     = new Trend('resync_ms', true)
const writeOk      = new Rate('score_write_ok')        // after the app-like retries
const writeMs      = new Trend('score_write_ms', true) // single request
const writeRetries = new Counter('score_write_retries')
const rlsBlockOk   = new Rate('rls_blocks_judge_boulder') // self-score on judge boulder refused
const rtSubOk      = new Rate('rt_subscribe_ok')
const rtSubMs      = new Trend('rt_subscribe_ms', true)
const rtEchoOk     = new Rate('rt_own_score_echoed')   // my own write came back over realtime
const rtDelivMs    = new Trend('rt_delivery_ms', true) // write -> other phones
const rtDrops      = new Counter('rt_unexpected_disconnects')
const rtErrors     = new Counter('rt_errors')
const fallbackPoll = new Counter('fallback_polls')     // app polls REST when realtime is down
const lbOk         = new Rate('public_leaderboard_ok')
const lbMs         = new Trend('public_leaderboard_ms', true)
const lbKB         = new Trend('public_leaderboard_kb')

// ── Scenarios ────────────────────────────────────────────────────────────────
const scenarios = {
  competitors: { executor: 'per-vu-iterations', exec: 'competitor', vus: N_COMP, iterations: 1,
                 maxDuration: `${TOTAL + 240}s`, gracefulStop: '30s' },
}
if (N_JUDGE > 0) scenarios.judges = { executor: 'per-vu-iterations', exec: 'judge', vus: N_JUDGE,
                 iterations: 1, maxDuration: `${TOTAL + 240}s`, gracefulStop: '30s' }
if (N_VIEW > 0)  scenarios.viewers = { executor: 'constant-vus', exec: 'viewer', vus: N_VIEW,
                 duration: `${TOTAL}s`, gracefulStop: '20s' }

export const options = {
  scenarios,
  setupTimeout: '2m',
  discardResponseBodies: true,   // bodies are only kept where the script needs them
  thresholds: {
    login_ok:                  ['rate>0.99'],
    join_ok:                   ['rate>0.99'],
    initial_load_ok:           ['rate>0.99'],
    initial_load_ms:           ['p(95)<8000'],
    resync_ok:                 ['rate>0.98'],
    resync_ms:                 ['p(95)<6000'],
    score_write_ok:            ['rate>0.995'],
    score_write_ms:            ['p(95)<1500'],
    rls_blocks_judge_boulder:  ['rate==1'],
    rt_subscribe_ok:           ['rate>0.98'],
    rt_own_score_echoed:       ['rate>0.97'],
    rt_delivery_ms:            ['p(95)<3000'],
    public_leaderboard_ok:     ['rate>0.99'],
    public_leaderboard_ms:     ['p(95)<4000'],
  },
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────
function headers(token, extra) {
  const h = { apikey: ANON, 'Content-Type': 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  else if (BEARER_ANON) h.Authorization = `Bearer ${ANON}`
  return Object.assign(h, extra || {})
}
function params(token, name, body, extra) {
  return { headers: headers(token, extra && extra.headers), tags: { name }, timeout: (extra && extra.timeout) || '30s',
           responseType: body ? 'text' : 'none', responseCallback: extra && extra.expect }
}
const rest  = p => `${URL}/rest/v1/${p}`
const get   = (token, path, name, body) => http.get(rest(path), params(token, name, body))
const rpc   = (token, fn, args, name, body) => http.post(rest(`rpc/${fn}`), JSON.stringify(args), params(token, name, body))
const ok2xx = r => r.status >= 200 && r.status < 300
const json  = r => { try { return JSON.parse(r.body) } catch (_) { return null } }
const rand  = (a, b) => a + Math.random() * (b - a)
const pick  = arr => arr[Math.floor(Math.random() * arr.length)]
const expo  = mean => -Math.log(1 - Math.random()) * mean        // seconds, Poisson-like gaps
const inList = ids => `(${ids.join(',')})`   // uuids / comp ids: no quoting needed

// Paged read exactly like fetchAllPages(): stops at the first short page.
// Rows are counted from Content-Range, so k6 does not keep the body.
function pages(token, path, name) {
  let rows = 0
  for (let from = 0; ; from += PAGE) {
    const r = get(token, `${path}&offset=${from}&limit=${PAGE}`, name)
    if (r.status !== 200) return { ok: false, rows }
    const m = /^(\d+)-(\d+)/.exec(r.headers['Content-Range'] || '')
    const n = m ? Number(m[2]) - Number(m[1]) + 1 : 0
    rows += n
    if (n < PAGE) return { ok: true, rows }
  }
}

const MEMBER_COLS = 'competition_id,user_id,role,status,bib_number,trait_ids,gender'

// Members + their profiles (100 per request) + staff emails RPC, like fetchMembersByStatus().
function members(token, ids, status, name) {
  const r = get(token, `competition_members?select=${MEMBER_COLS}&competition_id=in.${inList(ids)}` +
                       `&status=eq.${status}&order=joined_at.asc,user_id.asc&offset=0&limit=${PAGE}`, name, true)
  if (r.status !== 200) return null
  const rows = json(r) || []
  if (rows.length > 0) {
    const uids = [...new Set(rows.map(x => x.user_id))]
    const reqs = []
    for (let i = 0; i < uids.length; i += 100) {
      reqs.push(['GET', rest(`profiles?select=id,display_name,avatar_url,emoji&id=in.${inList(uids.slice(i, i + 100))}`),
                 null, params(token, 'profiles')])
    }
    reqs.push(['POST', rest('rpc/get_member_emails'), JSON.stringify({ p_competition_ids: ids }), params(token, 'rpc_get_member_emails')])
    const res = http.batch(reqs)
    if (!res.every(ok2xx)) return null
  }
  return rows
}

function login(email) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const t = Date.now()
    const r = http.post(`${URL}/auth/v1/token?grant_type=password`, JSON.stringify({ email, password: PASSWORD }),
      { headers: { apikey: ANON, 'Content-Type': 'application/json' }, tags: { name: 'auth_login' },
        responseType: 'text', timeout: '30s', responseCallback: http.expectedStatuses(200, 429) })
    if (r.status === 200) {
      const j = json(r)
      loginMs.add(Date.now() - t)
      loginOk.add(true)
      return { token: j.access_token, uid: j.user.id, email }
    }
    if (r.status === 429) { login429.add(1); sleep(Math.min(60, 5 * 2 ** attempt)); continue }
    console.error(`login ${email}: ${r.status} ${String(r.body).slice(0, 160)}`)
    break
  }
  loginOk.add(false)
  return null
}

// loadAllUserData(): competitions (owned / memberships / public), then for all
// of them boulders + active members + waitlist, and the active competition's
// scores. Pages run one after another here, so this time is an upper bound.
function initialLoad(s) {
  const t = Date.now()
  const [owned, mine, pub] = http.batch([
    ['GET', rest(`competitions?select=data&owner_id=eq.${s.uid}&order=created_at.desc`), null, params(s.token, 'comps_owned')],
    ['GET', rest(`competition_members?select=competition_id&user_id=eq.${s.uid}&status=eq.active`), null, params(s.token, 'comps_memberships', true)],
    ['GET', rest(`competitions?select=data&visibility=eq.public&owner_id=neq.${s.uid}&order=created_at.desc`), null, params(s.token, 'comps_public', true)],
  ])
  let good = ok2xx(owned) && ok2xx(mine) && ok2xx(pub)
  const memberIds = (json(mine) || []).map(m => m.competition_id)
  const publicIds = (json(pub) || []).map(c => c.data && c.data.id).filter(Boolean)
  if (memberIds.length > 0) {
    good = ok2xx(get(s.token, `competitions?select=data&id=in.${inList(memberIds)}&owner_id=neq.${s.uid}&order=created_at.desc`, 'comps_by_id')) && good
  }
  const ids = [...new Set([COMP, ...memberIds, ...publicIds])]
  good = pages(s.token, `boulders?select=competition_id,data,position&competition_id=in.${inList(ids)}&order=position.asc,id.asc`, 'boulders_all').ok && good
  const act = members(s.token, ids, 'active', 'members_all')
  const wl  = members(s.token, ids, 'waitlisted', 'waitlist_all')
  good = pages(s.token, `completions?select=data&competition_id=eq.${COMP}&order=competitor_id.asc,boulder_id.asc`, 'completions_page').ok
         && act !== null && wl !== null && good
  loadOk.add(good)
  loadMs.add(Date.now() - t)
  if (act) s.competitors = act.filter(m => m.competition_id === COMP && m.role === 'competitor').map(m => m.user_id)
}

// Resync after a phone wake-up / reconnect (App.tsx resync()).
function resync(s) {
  const t = Date.now()
  let good = pages(s.token, `completions?select=data&competition_id=eq.${COMP}&order=competitor_id.asc,boulder_id.asc`, 'completions_page').ok
  good = ok2xx(get(s.token, `boulders?select=data&competition_id=eq.${COMP}&order=position.asc`, 'boulders_one')) && good
  const act = members(s.token, [COMP], 'active', 'members_one')
  good = ok2xx(get(s.token, `competitions?select=data&id=eq.${COMP}`, 'comp_one')) && act !== null && good
  resyncOk.add(good)
  resyncMs.add(Date.now() - t)
  if (act) s.competitors = act.filter(m => m.role === 'competitor').map(m => m.user_id)
}

// Upsert like db.upsertCompletion(): 10 s timeout per request, retried.
function writeScore(s, boulderId, competitorId, data) {
  const body = JSON.stringify({ competition_id: COMP, competitor_id: competitorId, boulder_id: boulderId, data })
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = http.post(rest('completions'), body, params(s.token, 'score_upsert', false,
      { headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, timeout: '10s' }))
    writeMs.add(r.timings.duration)
    if (ok2xx(r)) return true
    if (r.status === 401 || r.status === 403) {
      console.error(`score refused ${r.status} (${s.email}, ${boulderId})`)
      return false
    }
    writeRetries.add(1)
    sleep(Math.min(8, 2 ** attempt))
  }
  return false
}

// ── Realtime (Phoenix protocol, as supabase-js speaks it) ────────────────────
const COMP_BINDINGS = [
  { event: '*',      schema: 'public', table: 'completions',         filter: `competition_id=eq.${COMP}` },
  { event: '*',      schema: 'public', table: 'boulders',            filter: `competition_id=eq.${COMP}` },
  { event: 'UPDATE', schema: 'public', table: 'competitions',        filter: `id=eq.${COMP}` },
  { event: 'INSERT', schema: 'public', table: 'competition_members', filter: `competition_id=eq.${COMP}` },
  { event: 'UPDATE', schema: 'public', table: 'competition_members', filter: `competition_id=eq.${COMP}` },
  { event: 'DELETE', schema: 'public', table: 'competition_members', filter: `competition_id=eq.${COMP}` },
]
const userBindings = uid => [
  { event: 'INSERT', schema: 'public', table: 'competition_members', filter: `user_id=eq.${uid}` },
  { event: 'INSERT', schema: 'public', table: 'competitions',        filter: 'visibility=eq.public' },
]
const RECONNECT_MS = [1000, 2000, 5000, 10000]   // supabase-js reconnectAfterMs
const loggedErrors = {}
function logOnce(msg) {
  if (Object.keys(loggedErrors).length < 25 && !loggedErrors[msg]) { loggedErrors[msg] = 1; console.warn(`[realtime] ${msg}`) }
}

function connect(s) {
  if (s.ended) return
  let ref = 0
  const send = m => { try { ws.send(JSON.stringify(m)) } catch (_) { /* socket closing */ } }
  const joinTopic = `realtime:comp:${COMP}`
  const started = Date.now()
  s.joined = false
  const ws = new WebSocket(WS_URL)
  s.ws = ws
  const stale = () => s.ws !== ws      // a socket we already closed (lock / reconnect)

  ws.onopen = () => {
    if (stale()) { try { ws.close() } catch (_) { /* closing */ } return }
    const config = b => ({ broadcast: { ack: false, self: false }, presence: { key: '' }, postgres_changes: b, private: false })
    send({ topic: joinTopic, event: 'phx_join', payload: { config: config(COMP_BINDINGS), access_token: s.token }, ref: String(++ref), join_ref: '1' })
    send({ topic: `realtime:user-memberships:${s.uid}`, event: 'phx_join', payload: { config: config(userBindings(s.uid)), access_token: s.token }, ref: String(++ref), join_ref: '2' })
    s.heartbeat = setInterval(() => send({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++ref) }), 25000)
  }

  s.subTimer = setTimeout(() => {
    if (!stale() && !s.joined && !s.ended) { rtSubOk.add(false); logOnce('no "Subscribed to PostgreSQL" within 15 s') }
  }, 15000)

  ws.onmessage = e => {
    if (stale()) return
    let m
    try { m = JSON.parse(e.data) } catch (_) { return }
    const p = m.payload || {}
    if (m.topic === joinTopic && m.event === 'system') {
      if (p.status === 'ok' && p.extension === 'postgres_changes') {
        if (!s.joined) { s.joined = true; rtSubOk.add(true); rtSubMs.add(Date.now() - started); clearTimeout(s.subTimer) }
        if (s.resyncOnJoin) { s.resyncOnJoin = false; resync(s) }
      } else if (p.status === 'error') { rtErrors.add(1); logOnce(`system error: ${p.message}`) }
      return
    }
    if (m.event === 'phx_reply' && p.status === 'error') { rtErrors.add(1); logOnce(`join refused: ${JSON.stringify(p.response).slice(0, 160)}`); return }
    if (m.event === 'phx_error' || m.event === 'phx_close') { if (m.topic === joinTopic) { s.joined = false; rtErrors.add(1); logOnce(`${m.event} on comp channel`) } return }
    if (m.event !== 'postgres_changes') return
    const d = p.data || {}
    if (d.errors && d.errors.length) { rtErrors.add(1); logOnce(`change errors: ${JSON.stringify(d.errors)}`) }
    if (d.table !== 'completions' || !d.record || !d.record.data) return
    const ts  = Number(d.record.data.timestamp)
    const age = Date.now() - ts
    if (age >= 0 && age < 120000) rtDelivMs.add(age)           // written during this test
    const mine = s.pending[d.record.boulder_id]
    if (d.record.competitor_id === s.uid && mine && mine.ts === ts) {
      rtEchoOk.add(true)
      delete s.pending[d.record.boulder_id]
    }
  }

  ws.onerror = e => { if (!stale()) { rtErrors.add(1); logOnce(`socket error: ${e && e.error}`) } }
  ws.onclose = () => {
    if (stale()) return                // closed on purpose: disconnect() already cleaned up
    clearInterval(s.heartbeat)
    clearTimeout(s.subTimer)
    s.joined = false
    s.ws = null
    if (s.ended) return
    // Unexpected drop: reconnect with backoff, resync once subscribed again.
    rtDrops.add(1)
    const delay = RECONNECT_MS[Math.min(s.reconnects++, RECONNECT_MS.length - 1)]
    s.resyncOnJoin = true
    s.reconnectTimer = setTimeout(() => { if (!s.locked) connect(s) }, delay)
  }
}

function disconnect(s) {
  clearTimeout(s.reconnectTimer)
  clearInterval(s.heartbeat)
  clearTimeout(s.subTimer)
  const ws = s.ws
  s.ws = null                          // marks it stale before its onclose fires
  s.joined = false
  try { ws && ws.close() } catch (_) { /* already closed */ }
}

// Health check every 20 s: if the channel is not joined, poll REST (App.tsx).
function startHealthCheck(s) {
  s.health = setInterval(() => {
    if (s.ended || s.locked || s.joined) return
    fallbackPoll.add(1)
    pages(s.token, `completions?select=data&competition_id=eq.${COMP}&order=competitor_id.asc,boulder_id.asc`, 'completions_page')
    get(s.token, `boulders?select=data&competition_id=eq.${COMP}&order=position.asc`, 'boulders_one')
  }, 20000)
}

function newSession(user) {
  return Object.assign(user, { pending: {}, competitors: [], joined: false, locked: false, ended: false,
                               reconnects: 0, resyncOnJoin: false })
}

// Ends the session at the common end time (all users leave together).
function scheduleEnd(s, endAt) {
  setTimeout(() => {
    s.ended = true
    clearInterval(s.health)
    clearTimeout(s.actTimer)
    clearTimeout(s.lockTimer)
    disconnect(s)
  }, Math.max(1000, endAt - Date.now()))
}

// Checks 15 s later that my own write came back over realtime. Only counted
// when the channel was joined at write time and the phone stayed unlocked.
function expectEcho(s, boulderId, ts) {
  if (!s.joined) return
  s.pending[boulderId] = { ts }
  setTimeout(() => {
    const p = s.pending[boulderId]
    if (p && p.ts === ts) {
      delete s.pending[boulderId]
      if (!s.locked && !s.ended) rtEchoOk.add(false)
    }
  }, 15000)
}

// ── Setup: the test competition must exist ───────────────────────────────────
export function setup() {
  const owner = login(`lt-owner${DOMAIN}`)
  if (!owner) exec.test.abort('Cannot log in as lt-owner. Did you run 01_seed.sql?')
  const c = json(get(owner.token, `competitions?select=id,status&id=eq.${COMP}`, 'setup', true)) || []
  if (c.length !== 1 || c[0].status !== 'LIVE') exec.test.abort('comp-loadtest missing or not LIVE. Run 01_seed.sql first.')
  const b = json(get(owner.token, `boulders?select=id,judge:data-%3EisPuntuable&competition_id=eq.${COMP}&order=position.asc`, 'setup', true)) || []
  const selfB  = b.filter(x => x.judge !== true).map(x => x.id)
  const judgeB = b.filter(x => x.judge === true).map(x => x.id)
  if (selfB.length === 0 || judgeB.length === 0) exec.test.abort('Test boulders missing. Run 01_seed.sql first.')
  console.log(`Load test: ${N_COMP} competitors over ${ARRIVAL}s, ${N_JUDGE} judges, ${N_VIEW} viewers, ` +
              `${STEADY}s steady. ${selfB.length} self + ${judgeB.length} judge boulders.`)
  return { t0: Date.now(), selfB, judgeB }
}

// ── Competitor ───────────────────────────────────────────────────────────────
export function competitor(data) {
  const idx   = exec.scenario.iterationInTest              // 0 … N_COMP-1
  const endAt = data.t0 + TOTAL * 1000
  sleep((idx / Math.max(1, N_COMP)) * ARRIVAL)             // arrivals spread out

  const user = login(`lt-${String(idx + 1).padStart(3, '0')}${DOMAIN}`)
  if (!user) return
  const s = newSession(user)

  // Invite link -> join
  const t = Date.now()
  const inv = rpc(s.token, 'get_competition_by_invite', { p_code: INVITE }, 'rpc_get_competition_by_invite', true)
  const jr  = rpc(s.token, 'join_competition', { p_competition_id: COMP }, 'rpc_join_competition', true)
  const st  = (json(jr) || {}).status
  joinMs.add(Date.now() - t)
  joinOk.add(ok2xx(inv) && ok2xx(jr) && (st === 'joined' || st === 'already'))
  if (st !== 'joined' && st !== 'already') { console.error(`join ${s.email}: ${jr.status} ${String(jr.body).slice(0, 160)}`); return }

  initialLoad(s)
  connect(s)
  startHealthCheck(s)
  scheduleEnd(s, endAt)

  // The climber works on one boulder at a time: each attempt is a write.
  const state = {}
  let project = pick(data.selfB)

  function act() {
    if (s.ended) return
    if (!s.locked) {
      const roll = Math.random()
      if (roll < 0.03) {
        // Tries to self-score a judge-only boulder: must be refused.
        const b = pick(data.judgeB)
        const r = http.post(rest('completions'),
          JSON.stringify({ competition_id: COMP, competitor_id: s.uid, boulder_id: b,
                           data: { competitorId: s.uid, boulderId: b, attempts: 1, timestamp: Date.now(),
                                   hasZone: true, zoneAttempts: 1, zonesReached: 1, topValidated: true } }),
          params(s.token, 'score_forbidden', false, { headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
                                                    expect: http.expectedStatuses(401, 403) }))
        rlsBlockOk.add(r.status === 401 || r.status === 403)
      } else if (roll < 0.05 && Object.keys(state).length > 0) {
        // Un-marks a boulder (delete), like db.deleteCompletion().
        const b = pick(Object.keys(state))
        const r = http.del(rest(`completions?competition_id=eq.${COMP}&competitor_id=eq.${s.uid}&boulder_id=eq.${b}&select=boulder_id`),
          null, params(s.token, 'score_delete', false, { headers: { Prefer: 'return=representation' }, timeout: '10s' }))
        writeOk.add(ok2xx(r))
        delete state[b]
      } else {
        const cur = state[project] || { attempts: 0, zone: false, top: false }
        cur.attempts += 1
        cur.zone = cur.zone || Math.random() < 0.6
        cur.top  = Math.random() < 0.35
        state[project] = cur
        const ts = Date.now()
        const okW = writeScore(s, project, s.uid, {
          competitorId: s.uid, boulderId: project, attempts: cur.attempts, timestamp: ts,
          hasZone: cur.zone, zoneAttempts: cur.zone ? Math.min(cur.attempts, 2) : 0,
          zonesReached: cur.zone ? 1 : 0, topValidated: cur.top })
        writeOk.add(okW)
        if (okW) expectEcho(s, project, ts)
        if (cur.top || cur.attempts >= 5) project = pick(data.selfB)
      }
    }
    s.actTimer = setTimeout(act, expo(WRITE_EVERY) * 1000)
  }
  s.actTimer = setTimeout(act, expo(WRITE_EVERY) * 1000)

  // Phone lock / unlock cycle
  function lock() {
    if (s.ended) return
    s.locked = true
    disconnect(s)
    s.lockTimer = setTimeout(() => {
      if (s.ended) return
      s.locked = false
      s.reconnects = 0
      resync(s)                  // visibilitychange after > 15 s hidden
      connect(s)
      s.lockTimer = setTimeout(lock, expo(LOCK_EVERY) * 1000)
    }, rand(20, 120) * 1000)
  }
  s.lockTimer = setTimeout(lock, expo(LOCK_EVERY) * 1000)
}

// ── Judge ────────────────────────────────────────────────────────────────────
export function judge(data) {
  const idx   = exec.scenario.iterationInTest
  const endAt = data.t0 + TOTAL * 1000
  sleep(idx * 2)
  const user = login(`lt-judge-${String(idx + 1).padStart(2, '0')}${DOMAIN}`)
  if (!user) return
  const s = newSession(user)
  initialLoad(s)
  connect(s)
  startHealthCheck(s)
  scheduleEnd(s, endAt)

  let lastRefresh = Date.now()
  function act() {
    if (s.ended) return
    if (Date.now() - lastRefresh > 60000) {   // new competitors keep arriving
      const rows = members(s.token, [COMP], 'active', 'members_one')
      if (rows) s.competitors = rows.filter(m => m.role === 'competitor').map(m => m.user_id)
      lastRefresh = Date.now()
    }
    if (s.competitors.length > 0) {
      const who = pick(s.competitors)
      const b   = pick(data.judgeB)
      const ts  = Date.now()
      const okW = writeScore(s, b, who, {
        competitorId: who, boulderId: b, attempts: 1 + Math.floor(Math.random() * 4), timestamp: ts,
        hasZone: true, zoneAttempts: 1, zonesReached: 1, zoneValidatedBy: s.uid,
        topValidated: Math.random() < 0.7, topValidatedBy: s.uid, topValidatedAt: ts })
      writeOk.add(okW)
    }
    s.actTimer = setTimeout(act, expo(JUDGE_EVERY) * 1000)
  }
  s.actTimer = setTimeout(act, expo(JUDGE_EVERY) * 1000)
}

// ── Public results viewer (anonymous) ────────────────────────────────────────
export function viewer() {
  const first = exec.vu.iterationInScenario === 0
  if (first) sleep(Math.random() * 30)
  const r = http.post(rest('rpc/get_public_leaderboard'), JSON.stringify({ p_competition_id: COMP }),
    params(null, 'rpc_public_leaderboard', first, { timeout: '15s' }))
  lbMs.add(r.timings.duration)
  let good = r.status === 200
  if (first && good) {
    const body = String(r.body || '')
    lbKB.add(body.length / 1024)
    good = body.length > 2 && body !== 'null'
  }
  lbOk.add(good)
  sleep(good ? 30 : 5)   // PublicLeaderboardPage: 30 s, 5 s retry after a failure
}

export function teardown() {
  console.log('Done. Now run 02_verify.sql, and 03_cleanup.sql when you no longer need the data.')
}
