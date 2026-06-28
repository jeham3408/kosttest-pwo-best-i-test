import type { CompareCell } from './types'

export function formatMg(value: number | null | undefined): CompareCell {
  if (value === null || value === undefined) {
    return {
      display: 'Ikke dokumentert',
      kind: 'not-documented',
      raw: null,
      ariaLabel: 'Ikke dokumentert av produsent',
    }
  }
  if (value === 0) {
    return {
      display: '0 mg',
      kind: 'number',
      raw: 0,
      ariaLabel: '0 milligram',
    }
  }
  const label = `${Math.round(value).toLocaleString('nb-NO')} mg`
  return { display: label, kind: 'number', raw: value, ariaLabel: label }
}

export function formatText(value: string | null | undefined, missingLabel = 'Ikke dokumentert'): CompareCell {
  if (!value?.trim()) {
    return { display: missingLabel, kind: 'not-documented', ariaLabel: missingLabel }
  }
  return { display: value, kind: 'text', ariaLabel: value }
}

export function formatScore(score: number, max: number, grade?: string): CompareCell {
  const display = grade ? `${score} av ${max} (${grade})` : `${score} av ${max}`
  return {
    display,
    kind: 'score',
    raw: score,
    ariaLabel: `Formelscore ${score} av ${max}${grade ? `, karakter ${grade}` : ''}`,
  }
}

export function formatPriceKr(value: number): CompareCell {
  const display = new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
  return { display, kind: 'number', raw: value, ariaLabel: `${display} per dose` }
}

export function formatNotApplicable(label = 'Ikke relevant'): CompareCell {
  return { display: label, kind: 'not-applicable', ariaLabel: label }
}

export function isComparableNumeric(cell: CompareCell): cell is CompareCell & { raw: number } {
  return cell.kind === 'number' || cell.kind === 'score'
}
