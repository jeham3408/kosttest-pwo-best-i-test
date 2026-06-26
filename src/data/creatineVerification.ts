import queueData from './creatineVerificationQueue.json'

export type CreatineVerificationStatus = 'pending' | 'verified' | 'rejected'

export type CreatineQueueItem = {
  id: string
  status: CreatineVerificationStatus
  attempts: number
  verifiedAt?: string
  rejectedAt?: string
  rejectReason?: string
  lastAttemptAt?: string
}

export const creatineVerificationQueue = queueData as {
  version: number
  intervalMinutes: number
  lastRunAt: string | null
  lastVerifiedId: string | null
  lastCompletedId: string | null
  lastCompletedStatus: string | null
  currentProductId: string | null
  currentRunStartedAt: string | null
  queue: CreatineQueueItem[]
}

export function getCreatineVerificationStatus(productId: string): CreatineVerificationStatus {
  return creatineVerificationQueue.queue.find((item) => item.id === productId)?.status ?? 'pending'
}

export function creatineVerificationStats() {
  const counts = { pending: 0, verified: 0, rejected: 0 }
  for (const item of creatineVerificationQueue.queue) {
    counts[item.status] += 1
  }
  return {
    ...counts,
    total: creatineVerificationQueue.queue.length,
    intervalMinutes: creatineVerificationQueue.intervalMinutes,
    lastRunAt: creatineVerificationQueue.lastRunAt,
  }
}
