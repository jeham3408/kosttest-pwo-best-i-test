#!/usr/bin/env node
/**
 * Leser og vurderer tilbakemeldinger fra footer-skjemaet.
 *
 *   node scripts/feedback-process-queue.mjs audit      → tell pending + vis neste
 *   node scripts/feedback-process-queue.mjs pull       → hent nye fra Supabase til data/feedback-inbox.json
 *   node scripts/feedback-process-queue.mjs process    → vurder ÉN pending melding
 *   node scripts/feedback-process-queue.mjs status     → JSON-oversikt
 *   node scripts/feedback-process-queue.mjs sync-md    → oppdater data/feedback-review-status.md
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const INBOX_PATH = path.join(ROOT, 'data/feedback-inbox.json')
const STATUS_MD = path.join(ROOT, 'data/feedback-review-status.md')
const LOG_MARKER = '<!-- AGENT: Legg til nye rader øverst etter hver kjøring. -->'

const TYPE_LABELS = {
  missing_product: 'Mangler vi et produkt',
  product_error: 'Feil om et produkt',
  other: 'Annet om testen',
}

function readInbox() {
  try {
    const parsed = JSON.parse(fs.readFileSync(INBOX_PATH, 'utf8'))
    return Array.isArray(parsed.submissions) ? parsed : { submissions: [] }
  } catch {
    return { submissions: [] }
  }
}

function writeInbox(inbox) {
  fs.writeFileSync(INBOX_PATH, `${JSON.stringify(inbox, null, 2)}\n`)
}

function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true
    } else {
      args._.push(a)
    }
  }
  return args
}

function normalize(value) {
  return (value ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9æøå]+/gi, ' ')
    .trim()
}

function loadCatalogText() {
  const files = [
    'src/data/pwoProducts.ts',
    'src/data/proteinProducts.ts',
    'src/data/creatineProducts.ts',
  ]
  return files.map((rel) => {
    const full = path.join(ROOT, rel)
    return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : ''
  }).join('\n')
}

function findCatalogMatches(query, catalogText) {
  const needle = normalize(query)
  if (!needle || needle.length < 2) return []

  const nameMatches = [...catalogText.matchAll(/name:\s*['"`]([^'"`]+)['"`]/g)]
    .map((m) => m[1])
    .filter((name) => normalize(name).includes(needle) || needle.includes(normalize(name)))

  const brandMatches = [...catalogText.matchAll(/brand:\s*['"`]([^'"`]+)['"`]/g)]
    .map((m) => m[1])
    .filter((brand) => normalize(brand).includes(needle) || needle.includes(normalize(brand)))

  return [...new Set([...nameMatches, ...brandMatches])].slice(0, 8)
}

function triageSubmission(submission, catalogText) {
  const notes = []
  let verdict = 'needs_manual_review'
  let confidence = 'low'

  const searchTerms = [submission.name, submission.message].filter(Boolean)
  const matches = new Set()

  for (const term of searchTerms) {
    for (const hit of findCatalogMatches(term, catalogText)) {
      matches.add(hit)
    }
  }

  if (matches.size > 0) {
    verdict = 'likely_already_listed'
    confidence = 'high'
    notes.push(`Mulig treff i eksisterende katalog: ${[...matches].join(', ')}`)
  } else if (submission.type === 'missing_product') {
    verdict = 'candidate_for_testing'
    confidence = 'medium'
    notes.push('Fant ikke produktet i dagens PWO/protein/kreatin-data. Kandidat for manuell verifisering.')
  } else if (submission.type === 'product_error') {
    verdict = matches.size > 0 ? 'needs_product_correction' : 'needs_manual_review'
    confidence = matches.size > 0 ? 'high' : 'medium'
    notes.push(
      matches.size > 0
        ? 'Mulig feilrapport på eksisterende produkt — verifiser mot produsent/kilde og oppdater data.'
        : 'Feilrapport uten tydelig katalogtreff — finn produktet manuelt før retting.',
    )
  } else {
    notes.push('Generell tilbakemelding — krever manuell lesing.')
  }

  if (submission.category) {
    notes.push(`Foreslått kategori: ${submission.category}`)
  }

  return {
    verdict,
    confidence,
    catalogMatches: [...matches],
    notes,
    reviewedAt: new Date().toISOString(),
  }
}

async function pullFromSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY må være satt for pull.')
    process.exit(1)
  }

  const response = await fetch(
    `${url.replace(/\/$/, '')}/rest/v1/feedback_submissions?status=eq.pending&order=created_at.asc`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  )

  if (!response.ok) {
    console.error('Supabase pull failed:', response.status, await response.text())
    process.exit(1)
  }

  const rows = await response.json()
  const inbox = readInbox()
  const knownIds = new Set(inbox.submissions.map((s) => s.id))

  for (const row of rows) {
    if (knownIds.has(row.id)) continue
    inbox.submissions.push({
      id: row.id,
      type: row.type,
      name: row.name,
      category: row.category,
      message: row.message,
      email: row.email,
      sourcePage: row.source_page,
      status: row.status,
      createdAt: row.created_at,
      triageNotes: row.triage_notes,
      triageResult: row.triage_result,
    })
  }

  writeInbox(inbox)
  console.log(JSON.stringify({ pulled: rows.length, inboxTotal: inbox.submissions.length }, null, 2))
}

async function patchSupabase(id, patch) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false

  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/feedback_submissions?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  })

  return response.ok
}

function nextPending(inbox) {
  return inbox.submissions.find((s) => s.status === 'pending')
}

function audit() {
  const inbox = readInbox()
  const pending = inbox.submissions.filter((s) => s.status === 'pending')
  const triaged = inbox.submissions.filter((s) => s.status === 'triaged')
  const next = nextPending(inbox)

  console.log('=== Feedback audit ===')
  console.log(`Pending: ${pending.length}`)
  console.log(`Triaged: ${triaged.length}`)
  console.log(`Total: ${inbox.submissions.length}`)
  if (next) {
    console.log('\n➡️  NESTE:')
    console.log(JSON.stringify({
      id: next.id,
      type: next.type,
      name: next.name,
      category: next.category,
      message: next.message.slice(0, 160),
      sourcePage: next.sourcePage,
      createdAt: next.createdAt,
    }, null, 2))
  } else {
    console.log('\nIngen pending meldinger i inbox.')
  }
}

async function processOne() {
  const inbox = readInbox()
  const submission = nextPending(inbox)
  if (!submission) {
    console.log(JSON.stringify({ status: 'empty' }))
    return
  }

  const catalogText = loadCatalogText()
  const triage = triageSubmission(submission, catalogText)

  submission.status = 'triaged'
  submission.triageResult = triage
  submission.triageNotes = triage.notes.join(' ')
  writeInbox(inbox)

  await patchSupabase(submission.id, {
    status: 'triaged',
    triage_notes: submission.triageNotes,
    triage_result: triage,
  })

  const report = {
    status: 'processed',
    id: submission.id,
    type: submission.type,
    name: submission.name,
    verdict: triage.verdict,
    confidence: triage.confidence,
    catalogMatches: triage.catalogMatches,
    notes: triage.notes,
  }

  console.log(JSON.stringify(report, null, 2))
  syncMd()
}

function syncMd() {
  const inbox = readInbox()
  const pending = inbox.submissions.filter((s) => s.status === 'pending').length
  const processing = inbox.submissions.filter((s) => s.status === 'processing').length
  const triaged = inbox.submissions.filter((s) => s.status === 'triaged').length

  const rows = [...inbox.submissions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20)
    .map((s) => {
      const date = (s.createdAt ?? '').slice(0, 10)
      const type = TYPE_LABELS[s.type] ?? s.type
      const name = s.name ?? '—'
      const verdict = s.triageResult?.verdict ?? s.status
      return `| ${date} | ${type} | ${name.replace(/\|/g, '/')} | ${verdict} |`
    })
    .join('\n')

  const content = `# Tilbakemeldinger — status

Oppdateres av \`node scripts/feedback-process-queue.mjs sync-md\`.

## Kø

| Status | Antall |
|--------|--------|
| Venter | ${pending} |
| Under vurdering | ${processing} |
| Ferdig vurdert | ${triaged} |

## Siste meldinger

${LOG_MARKER}

| Dato | Type | Navn | Vurdering |
|------|------|------|-----------|
${rows || '| — | — | — | — |'}
`

  fs.writeFileSync(STATUS_MD, content)
  console.log(`Oppdatert ${STATUS_MD}`)
}

function statusJson() {
  const inbox = readInbox()
  const summary = {
    total: inbox.submissions.length,
    pending: inbox.submissions.filter((s) => s.status === 'pending').length,
    triaged: inbox.submissions.filter((s) => s.status === 'triaged').length,
    next: nextPending(inbox) ?? null,
  }
  console.log(JSON.stringify(summary, null, 2))
}

const cmd = parseArgs(process.argv)._[0] ?? 'audit'

switch (cmd) {
  case 'audit':
    audit()
    break
  case 'pull':
    await pullFromSupabase()
    break
  case 'process':
    await processOne()
    break
  case 'status':
    statusJson()
    break
  case 'sync-md':
    syncMd()
    break
  default:
    console.error(`Ukjent kommando: ${cmd}`)
    process.exit(1)
}
