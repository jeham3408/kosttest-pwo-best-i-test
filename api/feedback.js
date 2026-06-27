import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INBOX_PATH = path.join(__dirname, '..', 'data', 'feedback-inbox.json')

const VALID_TYPES = new Set(['missing_product', 'product_error', 'other'])
const VALID_CATEGORIES = new Set(['pwo', 'protein', 'kreatin', 'annet'])

function readJsonBody(request) {
  return typeof request.body === 'string' ? JSON.parse(request.body || '{}') : request.body || {}
}

function sanitizeText(value, maxLen) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLen)
}

function readLocalInbox() {
  try {
    const raw = fs.readFileSync(INBOX_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed.submissions) ? parsed : { submissions: [] }
  } catch {
    return { submissions: [] }
  }
}

function writeLocalInbox(inbox) {
  fs.mkdirSync(path.dirname(INBOX_PATH), { recursive: true })
  fs.writeFileSync(INBOX_PATH, `${JSON.stringify(inbox, null, 2)}\n`)
}

async function persistToSupabase(record) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null

  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/feedback_submissions`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      type: record.type,
      name: record.name,
      category: record.category,
      message: record.message,
      email: record.email,
      source_page: record.sourcePage,
      status: 'pending',
      triage_notes: null,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Supabase insert failed: ${response.status} ${detail}`)
  }

  const rows = await response.json()
  return rows?.[0]?.id ?? null
}

function persistLocally(record) {
  const inbox = readLocalInbox()
  inbox.submissions.push(record)
  writeLocalInbox(inbox)
  return record.id
}

function typeLabel(type) {
  return {
    missing_product: 'Mangler vi et produkt',
    product_error: 'Feil om et produkt',
    other: 'Annet om testen',
  }[type] ?? type
}

async function persistToGitHub(record) {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_FEEDBACK_REPO || 'jeham3408/kosttest-pwo-best-i-test'
  if (!token) return null

  const title = `[Tilbakemelding] ${typeLabel(record.type)}${record.name ? ` — ${record.name}` : ''}`
  const body = [
    `**Type:** ${typeLabel(record.type)}`,
    record.name ? `**Produkt:** ${record.name}` : null,
    record.category ? `**Kategori:** ${record.category}` : null,
    `**Side:** ${record.sourcePage}`,
    record.email ? `**E-post:** ${record.email}` : null,
    `**ID:** ${record.id}`,
    '',
    record.message,
  ]
    .filter(Boolean)
    .join('\n')

  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title.slice(0, 240),
      body,
      labels: ['feedback'],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`GitHub issue create failed: ${response.status} ${detail}`)
  }

  const issue = await response.json()
  return issue?.number ? String(issue.number) : issue?.html_url ?? null
}

async function notifyWebhook(record) {
  const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL
  if (!webhookUrl) return

  const text = [
    `*Ny tilbakemelding på kosttest.no*`,
    `Type: ${typeLabel(record.type)}`,
    record.name ? `Navn: ${record.name}` : null,
    record.category ? `Kategori: ${record.category}` : null,
    `Side: ${record.sourcePage}`,
    record.email ? `E-post: ${record.email}` : null,
    '',
    record.message,
  ]
    .filter(Boolean)
    .join('\n')

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch(() => {})
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const body = readJsonBody(request)

  if (sanitizeText(body.website, 40)) {
    return response.status(200).json({ ok: true, message: 'Takk for meldingen.' })
  }

  const type = sanitizeText(body.type, 40)
  const name = sanitizeText(body.name, 200)
  const category = sanitizeText(body.category, 40) || null
  const message = sanitizeText(body.message, 2000)
  const email = sanitizeText(body.email, 120) || null
  const sourcePage = sanitizeText(body.sourcePage, 300) || '/'

  if (!VALID_TYPES.has(type)) {
    return response.status(400).json({ ok: false, error: 'Ugyldig meldingstype.' })
  }

  if (message.length < 10) {
    return response.status(400).json({ ok: false, error: 'Meldingen må ha minst 10 tegn.' })
  }

  if ((type === 'missing_product' || type === 'product_error') && name.length < 2) {
    return response.status(400).json({ ok: false, error: 'Oppgi produktnavn.' })
  }

  if (category && !VALID_CATEGORIES.has(category)) {
    return response.status(400).json({ ok: false, error: 'Ugyldig kategori.' })
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ ok: false, error: 'Ugyldig e-postadresse.' })
  }

  const record = {
    id: randomUUID(),
    type,
    name: name || null,
    category,
    message,
    email,
    sourcePage,
    status: 'pending',
    createdAt: new Date().toISOString(),
    triageNotes: null,
  }

  try {
    let storageId = null
    let storage = 'none'

    try {
      storageId = await persistToSupabase(record)
      if (storageId) storage = 'supabase'
    } catch (error) {
      console.error('Supabase feedback persist failed:', error)
    }

    if (!storageId) {
      try {
        storageId = await persistToGitHub(record)
        if (storageId) storage = 'github'
      } catch (error) {
        console.error('GitHub feedback persist failed:', error)
      }
    }

    if (!storageId && process.env.VERCEL !== '1') {
      storageId = persistLocally(record)
      storage = 'local'
    }

    if (!storageId && process.env.FEEDBACK_WEBHOOK_URL) {
      await notifyWebhook(record)
      storage = 'webhook'
      storageId = record.id
    }

    if (!storageId) {
      return response.status(503).json({
        ok: false,
        error: 'Tilbakemelding er ikke aktivert på serveren ennå. Kontakt oss på kosttest.no.',
      })
    }

    await notifyWebhook(record)

    return response.status(200).json({
      ok: true,
      id: storageId ?? record.id,
      storage,
      message: 'Takk! Vi har mottatt meldingen og vurderer forslaget.',
    })
  } catch (error) {
    console.error('Feedback handler error:', error)
    return response.status(500).json({ ok: false, error: 'Kunne ikke lagre meldingen.' })
  }
}
