import queueData from './proteinVerificationQueue.json'

export type ProteinVerificationStatus = 'pending' | 'verified' | 'rejected'

export type ProteinQueueItem = {
  id: string
  status: ProteinVerificationStatus
  attempts: number
  verifiedAt?: string
  rejectedAt?: string
  rejectReason?: string
  lastAttemptAt?: string
}

export const proteinVerificationQueue = queueData as {
  version: number
  intervalMinutes: number
  lastRunAt: string | null
  lastVerifiedId: string | null
  queue: ProteinQueueItem[]
}

export function getProteinVerificationStatus(productId: string): ProteinVerificationStatus {
  return proteinVerificationQueue.queue.find((item) => item.id === productId)?.status ?? 'pending'
}

/** Forklaring for «Kontrollert»-merke i proteinlisten — ikke vagt «verifisert». */
export function getProteinVerificationExplanation(productId: string): string {
  const status = getProteinVerificationStatus(productId)
  if (status !== 'verified') {
    return 'Produktdata er ikke gjennom full produktkontroll ennå.'
  }

  const hasAudit = ['bodylab-whey-100', 'dymatize-iso100', 'optimum-gold-standard', 'star-whey-100'].includes(
    productId,
  )

  if (hasAudit) {
    return 'Næringsdeklarasjon, porsjon og pris er kontrollert mot forhandler og etikettinformasjon. Ikke laboratorietest av Kosttest.'
  }

  return 'Produktdata er kontrollert mot forhandlerens produktside (deklarasjon og pris). Ikke laboratorietest av Kosttest.'
}

export function proteinVerificationStats() {
  const counts = { pending: 0, verified: 0, rejected: 0 }
  for (const item of proteinVerificationQueue.queue) {
    counts[item.status] += 1
  }
  return {
    ...counts,
    total: proteinVerificationQueue.queue.length,
    intervalMinutes: proteinVerificationQueue.intervalMinutes,
    lastRunAt: proteinVerificationQueue.lastRunAt,
  }
}
