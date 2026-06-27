#!/usr/bin/env node
/**
 * Leser, vurderer og køer tilbakemeldinger fra footer-skjemaet.
 *
 *   node scripts/feedback-process-queue.mjs pull-github → hent nye fra GitHub Issues
 *   node scripts/feedback-process-queue.mjs pull         → hent nye fra Supabase
 *   node scripts/feedback-process-queue.mjs audit        → se pending + neste melding
 *   node scripts/feedback-process-queue.mjs process      → vurder ÉN melding + lag ingest-plan
 *   node scripts/feedback-process-queue.mjs complete-ingest --id <feedbackId> --productId <id>
 *   node scripts/feedback-process-queue.mjs status       → JSON-oversikt
 *   node scripts/feedback-process-queue.mjs sync-md      → oppdater data/feedback-review-status.md
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const INBOX_PATH = path.join(ROOT, 'data/feedback-inbox.json')
const INGEST_PATH = path.join(ROOT, 'data/feedback-ingest-queue.json')
const STATUS_MD = path.join(ROOT, 'data/feedback-review-status.md')
const PROTEIN_QUEUE_PATH = path.join(ROOT, 'src/data/proteinVerificationQueue.json')
const LOG_MARKER = '<!-- AGENT: Legg til nye rader øverst etter hver kjøring. -->'

const VALID_TYPES = new Set(['missing_product', 'product_error', 'other'])
const CATEGORY_FILES = {
  pwo: 'src/data/pwoProducts.ts',
  protein: 'src/data/proteinProducts.ts',
  creatine: 'src/data/creatineProducts.ts',
  annet: null,
}

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

function readIngestQueue() {
  try {
    const parsed = JSON.parse(fs.readFileSync(INGEST_PATH, 'utf8'))
    return Array.isArray(parsed.items) ? parsed : { version: 1, items: [] }
  } catch {
    return { version: 1, items: [] }
  }
}

function writeIngestQueue(queue) {
  fs.writeFileSync(INGEST_PATH, `${JSON.stringify(queue, null, 2)}\n`)
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

function slugifyId(name, brand) {
  const parts = [brand, name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return parts || 'ukjent-produkt'
}

function parseBrandFromSuggestion(name) {
  const known = ['NutriTac', 'Peveo', 'Bodylab', 'Optimum', 'Dymatize', 'MyProtein', 'Star Nutrition', 'ESN']
  const lower = name.toLowerCase()
  for (const brand of known) {
    if (lower.includes(brand.toLowerCase())) return brand
  }
  const first = name.trim().split(/\s+/)[0]
  return first && first.length > 2 ? first : null
}

function inferCategory(submission) {
  const page = (submission.sourcePage ?? '').toLowerCase()
  if (page.includes('/kreatin')) return 'creatine'
  if (page.includes('/protein')) return 'protein'
  if (page.includes('/pwo')) return 'pwo'
  const cat = submission.category
  if (cat === 'kreatin') return 'creatine'
  if (cat === 'protein' || cat === 'pwo' || cat === 'creatine') return cat
  return cat === 'annet' ? 'annet' : 'pwo'
}

function loadCatalogText() {
  return Object.values(CATEGORY_FILES)
    .filter(Boolean)
    .map((rel) => {
      const full = path.join(ROOT, rel)
      return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : ''
    })
    .join('\n')
}

function productIdExists(productId, catalogText) {
  return new RegExp(`id:\\s*['"\`]${productId}['"\`]`).test(catalogText)
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

function parseCategoryProducts(category) {
  const text = loadCategoryText(category)
  if (!text) return []

  const products = []
  for (const match of text.matchAll(
    /id:\s*['"`]([^'"`]+)['"`][\s\S]*?name:\s*['"`]([^'"`]+)['"`][\s\S]*?brand:\s*['"`]([^'"`]+)['"`]/g,
  )) {
    products.push({ id: match[1], name: match[2], brand: match[3] })
  }
  return products
}

function suggestionTerms(submission) {
  const blob = normalize(`${submission.name ?? ''} ${submission.message ?? ''}`)
  return blob.split(/\s+/).filter((term) => term.length > 2 && !['sin', 'fra', 'det', 'som', 'med'].includes(term))
}

function findBestProductIdInCategory(submission, category) {
  const products = parseCategoryProducts(category)
  if (products.length === 0) return null

  const terms = suggestionTerms(submission)
  const brandHint = parseBrandFromSuggestion(submission.name ?? submission.message ?? '')
  let best = null
  let bestScore = 0

  for (const product of products) {
    let score = 0
    const nameNorm = normalize(product.name)
    const brandNorm = normalize(product.brand)

    if (brandHint && brandNorm === normalize(brandHint)) score += 4
    for (const term of terms) {
      if (nameNorm.includes(term)) score += 2
      if (brandNorm.includes(term)) score += 1
      if (term.includes('kreatin') && nameNorm.includes('kreatin')) score += 2
      if (term.includes('creatine') && nameNorm.includes('creatine')) score += 2
    }

    if (score > bestScore) {
      bestScore = score
      best = product.id
    }
  }

  return bestScore >= 3 ? best : null
}

function isTestSubmission(submission) {
  const blob = normalize(`${submission.name ?? ''} ${submission.message ?? ''}`)
  return /\btest\b/.test(blob) && /(tilbakemelding|skjema|feedback)/.test(blob)
}

function loadCategoryText(category) {
  const rel = CATEGORY_FILES[category]
  if (!rel) return ''
  const full = path.join(ROOT, rel)
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : ''
}

function findCategoryProductMatches(query, category) {
  return findCatalogMatches(query, loadCategoryText(category))
}

function triageSubmission(submission, catalogText) {
  const notes = []
  let verdict = 'needs_manual_review'
  let confidence = 'low'
  const category = inferCategory(submission)

  if (isTestSubmission(submission)) {
    return {
      verdict: 'rejected_invalid',
      confidence: 'high',
      catalogMatches: [],
      category,
      notes: ['Testmelding — ikke et produktforslag.'],
      reviewedAt: new Date().toISOString(),
    }
  }

  if (!VALID_TYPES.has(submission.type)) {
    return {
      verdict: 'rejected_invalid',
      confidence: 'high',
      catalogMatches: [],
      category,
      notes: ['Ugyldig eller utdatert meldingstype — ikke et kosttilskuddsforslag.'],
      reviewedAt: new Date().toISOString(),
    }
  }

  const searchTerms = [submission.name, submission.message].filter(Boolean)
  const globalMatches = new Set()
  const categoryMatches = new Set()

  for (const term of searchTerms) {
    for (const hit of findCatalogMatches(term, catalogText)) globalMatches.add(hit)
    for (const hit of findCategoryProductMatches(term, category)) categoryMatches.add(hit)
  }

  const matches = categoryMatches.size > 0 ? categoryMatches : globalMatches

  if (submission.type === 'other') {
    notes.push('Generell tilbakemelding — krever manuell lesing, ikke automatisk produkt-inntak.')
  } else if (categoryMatches.size > 0 && submission.type === 'missing_product') {
    verdict = 'likely_already_listed'
    confidence = 'high'
    notes.push(`Treff i ${category}-katalogen: ${[...categoryMatches].join(', ')}`)
  } else if (globalMatches.size > 0 && submission.type === 'missing_product' && category !== 'pwo') {
    verdict = 'candidate_for_testing'
    confidence = 'medium'
    notes.push(
      `Merke finnes i annen kategori (${[...globalMatches].join(', ')}), men ikke som ${category}-produkt. Legg til i ${category}-testen.`,
    )
  } else if (submission.type === 'missing_product') {
    verdict = 'candidate_for_testing'
    confidence = 'medium'
    notes.push('Fant ikke produktet i dagens PWO/protein/kreatin-data. Skal verifiseres og legges i testkø.')
  } else if (submission.type === 'product_error') {
    verdict = matches.size > 0 ? 'needs_product_correction' : 'needs_manual_review'
    confidence = matches.size > 0 ? 'high' : 'medium'
    notes.push(
      matches.size > 0
        ? 'Feilrapport på sannsynlig eksisterende produkt — verifiser mot produsent/kilde og oppdater data.'
        : 'Feilrapport uten tydelig katalogtreff — finn produktet manuelt før retting.',
    )
  }

  if (category) notes.push(`Foreslått kategori: ${category}`)

  return {
    verdict,
    confidence,
    catalogMatches: [...matches],
    category,
    notes,
    reviewedAt: new Date().toISOString(),
  }
}

function buildIngestPlan(submission, triage) {
  const category = triage.category ?? inferCategory(submission)
  const brand = parseBrandFromSuggestion(submission.name ?? '') ?? submission.brand ?? null
  const productId = slugifyId(submission.name ?? submission.message ?? 'produkt', brand ?? '')

  if (triage.verdict === 'rejected_invalid') {
    return {
      action: 'reject',
      reason: triage.notes[0],
      agentSteps: ['Marker meldingen som avvist. Ingen produktendring.'],
    }
  }

  if (triage.verdict === 'likely_already_listed') {
    const existingId = findBestProductIdInCategory(submission, category)
    const resolvedId = existingId ?? productId
    return {
      action: existingId ? 'already_listed' : 'duplicate',
      productId: resolvedId,
      category,
      agentSteps: existingId
        ? [
            `Produktet finnes i ${category}-testen som «${resolvedId}».`,
            'Bekreft at data stemmer mot butikk/produsent — oppdater ved behov.',
            'npm run build',
            `node scripts/feedback-process-queue.mjs complete-ingest --id ${submission.id} --productId ${resolvedId} --status listed`,
          ]
        : [
            'Produktet finnes sannsynligvis allerede — sjekk katalogtreff.',
            'Svar brukeren med lenke til riktig produktside på kosttest.no (ikke publiser e-post).',
            `node scripts/feedback-process-queue.mjs complete-ingest --id ${submission.id} --productId ${resolvedId} --status duplicate`,
          ],
    }
  }

  if (triage.verdict === 'needs_product_correction') {
    return {
      action: 'correct',
      productId,
      category,
      targetFile: CATEGORY_FILES[category] ?? null,
      agentSteps: [
        `Finn produktet i ${CATEGORY_FILES[category] ?? 'katalogen'}.`,
        'Verifiser påbutikk/produsent mot meldingen.',
        'Oppdater feil felt (pris, dose, ingredienser) med kilde.',
        'npm run build',
        `node scripts/feedback-process-queue.mjs complete-ingest --id ${submission.id} --productId ${productId} --status corrected`,
      ],
    }
  }

  if (triage.verdict === 'candidate_for_testing') {
    const targetFile = CATEGORY_FILES[category]
    const steps = [
      `Verifiser at produktet finnes på ekte butikkside (søk: «${submission.name}»).`,
      'Ikke finn på data — avvis hvis produktet ikke selges.',
    ]

    if (category === 'protein') {
      steps.push(
        `Legg til i src/data/proteinProducts.ts (rawProducts) med ekte pris, protein% og URL.`,
        `Legg productId «${productId}» i src/data/proteinVerificationQueue.json med status pending.`,
        'Følg deretter kosttest-protein-verify for full verifisering og bilde.',
      )
    } else if (category === 'creatine') {
      steps.push(
        `Legg til i src/data/creatineProducts.ts (rawProducts) med ekte dose, form (Creapure/mono), pris og URL.`,
        'Last ned produktbilde til public/products/<id>.jpg og oppdater data/creatine-images.json.',
      )
    } else if (category === 'pwo') {
      steps.push(
        'Legg til som listedProducts i src/data/pwoProducts.ts med status «Ikke rangert» til full dosekontroll.',
        'Etter verifisert ingredienstabell: flytt til testedProducts og beregn score.',
      )
    } else {
      steps.push('Manuell vurdering — ukjent kategori.')
    }

    steps.push('npm run build', `node scripts/feedback-process-queue.mjs complete-ingest --id ${submission.id} --productId ${productId} --status listed`)

    return {
      action: 'add_to_test',
      productId,
      category,
      brand,
      targetFile,
      agentSteps: steps,
    }
  }

  return {
    action: 'manual_review',
    productId,
    category,
    agentSteps: ['Les meldingen manuelt. Ingen automatisk produkt-inntak.'],
  }
}

function enqueueIngest(submission, plan) {
  if (!['add_to_test', 'correct'].includes(plan.action)) return null

  const queue = readIngestQueue()
  const existing = queue.items.find((item) => item.feedbackId === submission.id)
  if (existing) return existing

  const item = {
    feedbackId: submission.id,
    githubIssue: submission.githubIssue ?? null,
    productId: plan.productId,
    category: plan.category,
    suggestedName: submission.name,
    brand: plan.brand ?? null,
    status: 'pending_verify',
    targetFile: plan.targetFile,
    createdAt: new Date().toISOString(),
  }
  queue.items.unshift(item)
  writeIngestQueue(queue)
  return item
}

function addToProteinVerificationQueue(productId) {
  if (!fs.existsSync(PROTEIN_QUEUE_PATH)) return false
  const queue = JSON.parse(fs.readFileSync(PROTEIN_QUEUE_PATH, 'utf8'))
  if (queue.queue.some((entry) => entry.id === productId)) return true
  queue.queue.push({ id: productId, status: 'pending', attempts: 0, source: 'feedback' })
  fs.writeFileSync(PROTEIN_QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`)
  return true
}

function parseGitHubIssue(issue) {
  const body = issue.body ?? ''
  const field = (label) => {
    const match = body.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`))
    return match?.[1]?.trim() ?? null
  }

  const typeRaw = field('Type') ?? ''
  let type = 'other'
  if (/mangler/i.test(typeRaw)) type = 'missing_product'
  else if (/feil/i.test(typeRaw)) type = 'product_error'

  const categoryMap = { pwo: 'pwo', protein: 'protein', kreatin: 'creatine', creatin: 'creatine' }
  const categoryLabel = (field('Kategori') ?? '').toLowerCase()
  let category = null
  for (const [key, value] of Object.entries(categoryMap)) {
    if (categoryLabel.includes(key)) category = value
  }

  const idMatch = body.match(/\*\*ID:\*\*\s*([0-9a-f-]{36})/i)
  const messageLines = body.split('\n')
  const idLineIndex = messageLines.findIndex((line) => /^\*\*ID:\*\*/.test(line))
  const message =
    idLineIndex >= 0
      ? messageLines.slice(idLineIndex + 1).join('\n').trim()
      : body

  return {
    id: idMatch?.[1] ?? `github-${issue.number}`,
    githubIssue: issue.number,
    type,
    name: field('Produkt'),
    category,
    message: message || body,
    email: field('E-post'),
    sourcePage: field('Side') ?? '/',
    status: 'pending',
    createdAt: issue.created_at,
    triageNotes: null,
  }
}

async function pullFromGitHub() {
  const repo = process.env.GITHUB_FEEDBACK_REPO || 'jeham3408/kosttest-pwo-best-i-test'
  let issues = []

  try {
    const raw = execSync(
      `gh issue list --repo ${repo} --label feedback --state open --limit 50 --json number,title,body,createdAt`,
      { encoding: 'utf8' },
    )
    issues = JSON.parse(raw)
  } catch (error) {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      console.error('GitHub pull feilet. Sett GITHUB_TOKEN eller installer gh CLI.')
      process.exit(1)
    }
    const response = await fetch(
      `https://api.github.com/repos/${repo}/issues?labels=feedback&state=open&per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      },
    )
    if (!response.ok) {
      console.error('GitHub API pull failed:', response.status, await response.text())
      process.exit(1)
    }
    issues = await response.json()
  }

  const inbox = readInbox()
  const known = new Set(inbox.submissions.map((s) => s.id))
  let added = 0

  for (const issue of issues) {
    const submission = parseGitHubIssue(issue)
    if (known.has(submission.id)) continue
    inbox.submissions.push(submission)
    known.add(submission.id)
    added++
  }

  writeInbox(inbox)
  console.log(JSON.stringify({ pulled: added, openIssues: issues.length, inboxTotal: inbox.submissions.length }, null, 2))
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
  const ingest = readIngestQueue()
  const pending = inbox.submissions.filter((s) => s.status === 'pending')
  const triaged = inbox.submissions.filter((s) => s.status === 'triaged')
  const ingested = inbox.submissions.filter((s) => s.status === 'ingested')
  const next = nextPending(inbox)

  console.log('=== Feedback audit ===')
  console.log(`Pending: ${pending.length}`)
  console.log(`Triaged: ${triaged.length}`)
  console.log(`Ingested: ${ingested.length}`)
  console.log(`Ingest-kø (pending_verify): ${ingest.items.filter((i) => i.status === 'pending_verify').length}`)
  console.log(`Total: ${inbox.submissions.length}`)
  if (next) {
    console.log('\n➡️  NESTE:')
    console.log(JSON.stringify({
      id: next.id,
      githubIssue: next.githubIssue ?? null,
      type: next.type,
      name: next.name,
      category: inferCategory(next),
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
  const ingestPlan = buildIngestPlan(submission, triage)

  submission.status = triage.verdict === 'rejected_invalid' ? 'rejected' : 'triaged'
  submission.triageResult = triage
  submission.triageNotes = triage.notes.join(' ')
  submission.ingestPlan = ingestPlan

  const ingestItem = enqueueIngest(submission, ingestPlan)
  if (ingestPlan.action === 'add_to_test' && ingestPlan.category === 'protein' && ingestPlan.productId) {
    if (productIdExists(ingestPlan.productId, catalogText)) {
      addToProteinVerificationQueue(ingestPlan.productId)
    }
  }

  writeInbox(inbox)

  await patchSupabase(submission.id, {
    status: submission.status,
    triage_notes: submission.triageNotes,
    triage_result: { ...triage, ingestPlan },
  })

  const report = {
    status: 'processed',
    id: submission.id,
    githubIssue: submission.githubIssue ?? null,
    type: submission.type,
    name: submission.name,
    category: triage.category,
    verdict: triage.verdict,
    confidence: triage.confidence,
    catalogMatches: triage.catalogMatches,
    notes: triage.notes,
    ingestPlan,
    ingestQueueItem: ingestItem,
    agentMustDo: ingestPlan.agentSteps,
  }

  console.log(JSON.stringify(report, null, 2))
  syncMd()
}

function rejectSubmission(args) {
  const feedbackId = args.id
  const reason = args.reason ?? 'Avvist manuelt'
  if (!feedbackId) {
    console.error('--id er påkrevd')
    process.exit(1)
  }

  const inbox = readInbox()
  const submission = inbox.submissions.find((s) => s.id === feedbackId)
  if (!submission) {
    console.error(`Fant ikke melding ${feedbackId}`)
    process.exit(1)
  }

  submission.status = 'rejected'
  submission.triageNotes = reason
  submission.triageResult = {
    verdict: 'rejected_invalid',
    confidence: 'high',
    catalogMatches: [],
    category: inferCategory(submission),
    notes: [reason],
    reviewedAt: new Date().toISOString(),
  }
  writeInbox(inbox)
  syncMd()
  console.log(JSON.stringify({ ok: true, feedbackId, status: 'rejected', reason }, null, 2))
}

function completeIngest(args) {
  const feedbackId = args.id
  const productId = args.productId
  const status = args.status ?? 'listed'
  if (!feedbackId) {
    console.error('--id er påkrevd')
    process.exit(1)
  }

  const inbox = readInbox()
  const submission = inbox.submissions.find((s) => s.id === feedbackId)
  if (submission) {
    submission.status = 'ingested'
    submission.ingestedAt = new Date().toISOString()
    submission.ingestedProductId = productId ?? null
    submission.ingestStatus = status
  }

  const queue = readIngestQueue()
  const item = queue.items.find((entry) => entry.feedbackId === feedbackId)
  if (item) {
    item.status = status === 'duplicate' ? 'duplicate' : 'listed'
    item.productId = productId ?? item.productId
    item.completedAt = new Date().toISOString()
  }

  writeInbox(inbox)
  writeIngestQueue(queue)
  syncMd()
  console.log(JSON.stringify({ ok: true, feedbackId, productId, status }, null, 2))
}

function syncMd() {
  const inbox = readInbox()
  const ingest = readIngestQueue()
  const pending = inbox.submissions.filter((s) => s.status === 'pending').length
  const triaged = inbox.submissions.filter((s) => s.status === 'triaged').length
  const ingested = inbox.submissions.filter((s) => s.status === 'ingested').length
  const rejected = inbox.submissions.filter((s) => s.status === 'rejected').length
  const ingestPending = ingest.items.filter((i) => i.status === 'pending_verify').length

  const rows = [...inbox.submissions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20)
    .map((s) => {
      const date = (s.createdAt ?? '').slice(0, 10)
      const type = TYPE_LABELS[s.type] ?? s.type
      const name = s.name ?? '—'
      const verdict = s.ingestStatus ?? s.triageResult?.verdict ?? s.status
      return `| ${date} | ${type} | ${name.replace(/\|/g, '/')} | ${verdict} |`
    })
    .join('\n')

  const ingestRows = ingest.items
    .slice(0, 10)
    .map((item) => `| ${item.productId} | ${item.category} | ${item.suggestedName ?? '—'} | ${item.status} |`)
    .join('\n')

  const content = `# Tilbakemeldinger — status

Oppdateres av \`node scripts/feedback-process-queue.mjs sync-md\`.

## Kø

| Status | Antall |
|--------|--------|
| Venter (inbox) | ${pending} |
| Vurdert, venter ingest | ${triaged} |
| Lagt i test / ferdig | ${ingested} |
| Avvist | ${rejected} |
| Ingest-kø | ${ingestPending} |

## Siste meldinger

${LOG_MARKER}

| Dato | Type | Navn | Vurdering |
|------|------|------|-----------|
${rows || '| — | — | — | — |'}

## Ingest-kø (produkter fra tilbakemeldinger)

| productId | Kategori | Navn | Status |
|-----------|----------|------|--------|
${ingestRows || '| — | — | — | — |'}
`

  fs.writeFileSync(STATUS_MD, content)
  console.log(`Oppdatert ${STATUS_MD}`)
}

function statusJson() {
  const inbox = readInbox()
  const ingest = readIngestQueue()
  console.log(
    JSON.stringify(
      {
        total: inbox.submissions.length,
        pending: inbox.submissions.filter((s) => s.status === 'pending').length,
        triaged: inbox.submissions.filter((s) => s.status === 'triaged').length,
        ingested: inbox.submissions.filter((s) => s.status === 'ingested').length,
        ingestQueue: ingest.items.length,
        next: nextPending(inbox) ?? null,
      },
      null,
      2,
    ),
  )
}

const args = parseArgs(process.argv)
const cmd = args._[0] ?? 'audit'

switch (cmd) {
  case 'audit':
    audit()
    break
  case 'pull':
    await pullFromSupabase()
    break
  case 'pull-github':
    await pullFromGitHub()
    break
  case 'process':
    await processOne()
    break
  case 'complete-ingest':
    completeIngest(args)
    break
  case 'reject':
    rejectSubmission(args)
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
