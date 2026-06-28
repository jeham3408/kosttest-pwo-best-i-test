import { getPwoBadges } from '../pwo/badges'
import { buildPwoBadgeContext } from '../pwo/badges'
import { getProteinBadges, buildProteinBadgeContext } from '../protein/badges'
import { getCreatineBadges, buildCreatineBadgeContext } from '../creatine/badges'
import { testedCreatineProducts } from '../creatineProducts'
import { testedProteinProducts } from '../proteinProducts'
import { testedProducts } from '../pwoProducts'
import type { ProductTrustSnapshot, TestCategory } from './types'
import { MISSING_VALUE } from './labels'
import { resolveCreatineTrust } from './resolvers/creatine'
import { resolveProteinTrust } from './resolvers/protein'
import { resolvePwoTrust } from './resolvers/pwo'

export type TrustValidationIssue = {
  severity: 'error' | 'warning'
  productId: string
  category: TestCategory
  code: string
  message: string
}

function isMissingDate(value: string): boolean {
  return !value || value === MISSING_VALUE || /venter på kontroll/i.test(value)
}

export function validateTrustSnapshot(snapshot: ProductTrustSnapshot): TrustValidationIssue[] {
  const issues: TrustValidationIssue[] = []
  const id = snapshot.productId
  const cat = snapshot.category

  if (snapshot.isRanked && snapshot.rankingStatus === 'ranked' && isMissingDate(snapshot.lastVerifiedAt)) {
    issues.push({
      severity: 'warning',
      productId: id,
      category: cat,
      code: 'missing_last_verified',
      message: 'Rangert produkt mangler sist kontrollert-dato per produkt.',
    })
  }

  if (
    snapshot.dopingTestStatusCode === 'documented' &&
    snapshot.sourceLinks.length === 0 &&
    cat === 'creatine'
  ) {
    issues.push({
      severity: 'warning',
      productId: id,
      category: cat,
      code: 'doping_without_source',
      message: 'Dopingtest markert som dokumentert uten kildelenke.',
    })
  }

  if (
    /laboratoriemålt|laboratorietest|offisiell diaas/i.test(snapshot.labTestStatus) &&
    snapshot.laboratoryTestStatus === 'unknown'
  ) {
    issues.push({
      severity: 'error',
      productId: id,
      category: cat,
      code: 'lab_label_without_status',
      message: 'Laboratorietest i visning uten eksplisitt teststatus.',
    })
  }

  if (
    snapshot.documentationStatus === 'unknown' &&
    snapshot.isRanked &&
    snapshot.dataConfidence === 'high'
  ) {
    issues.push({
      severity: 'warning',
      productId: id,
      category: cat,
      code: 'high_confidence_no_source',
      message: 'Høy datakvalitet uten dokumentert kildegrunnlag.',
    })
  }

  if (
    snapshot.documentationStatus === 'incomplete' &&
    snapshot.isRanked &&
    !snapshot.pendingReason
  ) {
    issues.push({
      severity: 'warning',
      productId: id,
      category: cat,
      code: 'incomplete_shown_as_ranked',
      message: 'Ufullstendig deklarasjon vises som fullt rangert uten pendingReason.',
    })
  }

  return issues
}

export function validateBadgeVsTrust(snapshot: ProductTrustSnapshot, badgeCount: number): TrustValidationIssue[] {
  if (snapshot.dataConfidence !== 'limited' || badgeCount === 0) return []
  return [
    {
      severity: 'warning',
      productId: snapshot.productId,
      category: snapshot.category,
      code: 'badge_with_limited_confidence',
      message: `Produkt med begrenset datakvalitet har ${badgeCount} badge(r).`,
    },
  ]
}

export function validateAllProductTrust(): TrustValidationIssue[] {
  const issues: TrustValidationIssue[] = []
  const pwoCtx = buildPwoBadgeContext(testedProducts)
  const proteinCtx = buildProteinBadgeContext(testedProteinProducts)
  const creatineCtx = buildCreatineBadgeContext(testedCreatineProducts)

  for (const p of testedProducts) {
    const snap = resolvePwoTrust(p)
    issues.push(...validateTrustSnapshot(snap))
    issues.push(...validateBadgeVsTrust(snap, getPwoBadges(p, pwoCtx).length))
  }
  for (const p of testedProteinProducts) {
    const snap = resolveProteinTrust(p)
    issues.push(...validateTrustSnapshot(snap))
    issues.push(...validateBadgeVsTrust(snap, getProteinBadges(p, proteinCtx).length))
  }
  for (const p of testedCreatineProducts) {
    const snap = resolveCreatineTrust(p)
    issues.push(...validateTrustSnapshot(snap))
    issues.push(...validateBadgeVsTrust(snap, getCreatineBadges(p, creatineCtx).length))
  }

  return issues
}
