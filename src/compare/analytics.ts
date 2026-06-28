import type { CompareCategory } from './types'

export type CompareAnalyticsEvent =
  | { type: 'compare_add'; category: CompareCategory; productId: string; count: number }
  | { type: 'compare_remove'; category: CompareCategory; productId: string; count: number }
  | { type: 'compare_open'; category: CompareCategory; productIds: string[] }
  | { type: 'compare_share'; category: CompareCategory; productIds: string[] }
  | { type: 'compare_clear'; category: CompareCategory }
  | {
      type: 'compare_external_link'
      category: CompareCategory
      productId: string
      merchant: string
    }

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

/**
 * Privacy-vennlege sammenligningshendingar.
 * Ingen persondata — bare kategori, produkt-id og tal.
 * Lyttarar kan registrere seg på `kosttest:compare` CustomEvent.
 */
export function trackCompareEvent(event: CompareAnalyticsEvent): void {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent('kosttest:compare', { detail: event }))

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: `kosttest_${event.type}`,
      compare_category: event.category,
      ...(event.type === 'compare_add' || event.type === 'compare_remove'
        ? { compare_product_id: event.productId, compare_count: event.count }
        : {}),
      ...(event.type === 'compare_open' || event.type === 'compare_share'
        ? { compare_product_ids: event.productIds.join(',') }
        : {}),
      ...(event.type === 'compare_external_link'
        ? { compare_product_id: event.productId, compare_merchant: event.merchant }
        : {}),
    })
  }

  if (import.meta.env.DEV) {
    console.debug('[kosttest:compare]', event)
  }
}
