/**
 * Privacy-vennlege produkthendingar uten persondata.
 * Lyttarar kan registrere seg på `kosttest:analytics` CustomEvent.
 * dataLayer pushes er valgfrie (f.eks. ved samtykkebasert tag manager).
 */
import type { CompareCategory } from '../compare/types'

export type ProductAnalyticsEvent =
  | { type: 'category_open'; category: CompareCategory | 'home' }
  | { type: 'filter_apply'; category: CompareCategory; filterKey: string; filterValue: string }
  | { type: 'product_card_open'; category: CompareCategory; productId: string }
  | { type: 'external_product_link'; category: CompareCategory; productId: string; merchant: string }
  | { type: 'feedback_start'; surface: 'product' | 'site' | 'data' }
  | { type: 'feedback_sent'; surface: 'product' | 'site' | 'data'; subType: string }
  | { type: 'search_navigate'; query: string }

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export function trackProductEvent(event: ProductAnalyticsEvent): void {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent('kosttest:analytics', { detail: event }))

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: `kosttest_${event.type}`,
      ...event,
    })
  }

  if (import.meta.env.DEV) {
    console.debug('[kosttest:analytics]', event)
  }
}
