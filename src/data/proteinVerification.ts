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
