import bodylabAudit from '../../../data/protein-verifications/bodylab-whey-100.json'
import dymatizeAudit from '../../../data/protein-verifications/dymatize-iso100.json'
import optimumAudit from '../../../data/protein-verifications/optimum-gold-standard.json'
import starAudit from '../../../data/protein-verifications/star-whey-100.json'
import type { ProductChangeEntry } from './types'

type ProteinAuditFile = {
  id: string
  verifiedAt?: string
  sources?: string[]
  corrections?: string[]
  checks?: Record<string, boolean>
}

const audits: Record<string, ProteinAuditFile> = {
  'bodylab-whey-100': bodylabAudit as ProteinAuditFile,
  'dymatize-iso100': dymatizeAudit as ProteinAuditFile,
  'optimum-gold-standard': optimumAudit as ProteinAuditFile,
  'star-whey-100': starAudit as ProteinAuditFile,
}

function formatAuditDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function correctionToChangeEntry(iso: string, correction: string): ProductChangeEntry {
  const date = formatAuditDate(iso)
  const lower = correction.toLowerCase()
  let type: ProductChangeEntry['type'] = 'other'
  let affectsPrice = false
  let affectsScore = false

  if (lower.includes('pris')) {
    type = 'price'
    affectsPrice = true
  } else if (lower.includes('diaas') || lower.includes('score') || lower.includes('protein')) {
    type = 'score'
    affectsScore = true
  } else if (lower.includes('url') || lower.includes('navn') || lower.includes('porsjon') || lower.includes('deklarasjon')) {
    type = 'declaration'
  }

  return {
    date,
    dateIso: iso,
    type,
    source: 'Kontroll mot forhandlerdata',
    affectsPrice,
    affectsScore,
    publicSummary: `${date}: ${correction.replace(/^Feil /i, '').replace(/→/g, '→')}`,
  }
}

export function getProteinAudit(productId: string): ProteinAuditFile | null {
  return audits[productId] ?? null
}

export function buildProteinAuditChangeLog(productId: string): ProductChangeEntry[] {
  const audit = getProteinAudit(productId)
  if (!audit?.verifiedAt || !audit.corrections?.length) return []
  return audit.corrections.map((c) => correctionToChangeEntry(audit.verifiedAt!, c))
}

export function getProteinAuditSourceLinks(productId: string): { label: string; url: string }[] {
  const audit = getProteinAudit(productId)
  if (!audit?.sources?.length) return []
  return audit.sources.map((url, i) => ({
    label: i === 0 ? 'Produktside (kontrollert)' : `Kjelde ${i + 1}`,
    url,
  }))
}

export function getProteinAuditVerifiedDisplay(productId: string): { date: string; iso: string } | null {
  const audit = getProteinAudit(productId)
  if (!audit?.verifiedAt) return null
  return { date: formatAuditDate(audit.verifiedAt), iso: audit.verifiedAt }
}
