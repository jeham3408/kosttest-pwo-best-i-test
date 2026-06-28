import { type FormEvent, useId, useState } from 'react'
import { AlertCircle, Send } from 'lucide-react'
import { trackProductEvent } from '../../analytics'

export type ProductFeedbackSubType =
  | 'wrong_price'
  | 'wrong_ingredients'
  | 'wrong_dose'
  | 'discontinued'
  | 'missing_product'
  | 'documentation_available'
  | 'wrong_ranking'
  | 'other'

export type ProductFeedbackContext = {
  category: 'pwo' | 'protein' | 'creatine'
  productId: string
  slug: string
  productName: string
  score?: number
  rank?: number
  lastChecked: string
  productUrl?: string
  pageUrl: string
}

const subTypeOptions: { value: ProductFeedbackSubType; label: string }[] = [
  { value: 'wrong_price', label: 'Feil pris' },
  { value: 'wrong_ingredients', label: 'Feil ingrediensliste' },
  { value: 'wrong_dose', label: 'Feil dose' },
  { value: 'discontinued', label: 'Produkt utgått' },
  { value: 'missing_product', label: 'Manglende produkt' },
  { value: 'documentation_available', label: 'Dokumentasjon tilgjengelig' },
  { value: 'wrong_ranking', label: 'Feil i rangering' },
  { value: 'other', label: 'Annet' },
]

type ProductFeedbackFormProps = {
  context?: ProductFeedbackContext
  variant?: 'inline' | 'button'
  defaultOpen?: boolean
}

export default function ProductFeedbackForm({
  context,
  variant = 'inline',
  defaultOpen = false,
}: ProductFeedbackFormProps) {
  const formId = useId()
  const [open, setOpen] = useState(defaultOpen || variant === 'inline')
  const [subType, setSubType] = useState<ProductFeedbackSubType>('wrong_price')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState(context?.productUrl ?? '')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [statusText, setStatusText] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = message.trim()
    if (trimmed.length < 10) {
      setStatus('error')
      setStatusText('Skriv minst 10 tegn.')
      return
    }

    setStatus('sending')
    const subLabel = subTypeOptions.find((o) => o.value === subType)?.label ?? subType
    const metadata = context
      ? {
          subType,
          productId: context.productId,
          slug: context.slug,
          category: context.category,
          score: context.score,
          rank: context.rank,
          lastChecked: context.lastChecked,
          productUrl: context.productUrl,
          pageUrl: context.pageUrl,
          link: link.trim() || null,
        }
      : { subType, link: link.trim() || null }

    const fullMessage = [
      `Type: ${subLabel}`,
      context ? `Produkt: ${context.productName} (${context.slug})` : null,
      context?.score != null ? `Score: ${context.score}` : null,
      link.trim() ? `Lenke: ${link.trim()}` : null,
      '',
      trimmed,
      '',
      '---',
      'Kontekst (auto):',
      JSON.stringify(metadata, null, 2),
    ]
      .filter(Boolean)
      .join('\n')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: subType === 'missing_product' ? 'missing_product' : 'product_error',
          name: context?.productName ?? '',
          category: context?.category ?? 'pwo',
          message: fullMessage,
          email: email.trim() || null,
          sourcePage: typeof window !== 'undefined' ? window.location.pathname : context?.pageUrl,
        }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string; message?: string }
      if (!response.ok || !result.ok) {
        setStatus('error')
        setStatusText(result.error ?? 'Kunne ikke sende.')
        return
      }
      setStatus('sent')
      setStatusText('Takk! Innsendingen blir vurdert manuelt — rangeringen endrer seg ikke automatisk.')
      trackProductEvent({ type: 'feedback_sent', surface: 'product', subType })
      setMessage('')
    } catch {
      setStatus('error')
      setStatusText('Nettverksfeil. Prøv igjen.')
    }
  }

  const trigger = variant === 'button' && !open && (
    <button type="button" className="button secondary product-feedback-trigger" onClick={() => { trackProductEvent({ type: 'feedback_start', surface: 'product' }); setOpen(true) }}>
      Meld feil eller send oppdatert produktdata
    </button>
  )

  return (
    <div className="product-feedback" aria-labelledby={`${formId}-title`}>
      {trigger}
      {(open || variant === 'inline') && (
        <>
          <div className="product-feedback-intro">
            <AlertCircle size={16} aria-hidden="true" />
            <div>
              <h5 id={`${formId}-title`}>Meld feil eller send oppdatert produktdata</h5>
              <p>
                Innsending endrer ikke rangeringen automatisk. Alle meldinger blir vurdert manuelt.
                {context ? (
                  <>
                    {' '}
                    Kontekst er forhåndsutfylt for <strong>{context.productName}</strong>.
                  </>
                ) : null}
              </p>
            </div>
            {variant === 'button' ? (
              <button type="button" className="button secondary" onClick={() => setOpen(false)}>
                Lukk
              </button>
            ) : null}
          </div>
          <form className="product-feedback-form" onSubmit={handleSubmit} noValidate>
            <label>
              Type melding
              <select value={subType} onChange={(e) => setSubType(e.target.value as ProductFeedbackSubType)}>
                {subTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Lenke til produktside eller dokumentasjon (valgfritt)
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                maxLength={500}
              />
            </label>
            <label>
              Beskrivelse
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
                maxLength={2000}
                placeholder="Forklar hva som er feil eller legg ved detaljer om ny etikett/pris."
              />
            </label>
            <label>
              E-post (valgfritt)
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
            </label>
            <button type="submit" className="button primary" disabled={status === 'sending'}>
              <Send size={14} aria-hidden="true" />
              {status === 'sending' ? 'Sender…' : 'Send inn'}
            </button>
            {statusText ? (
              <p className={`product-feedback-status product-feedback-status--${status}`} role="status">
                {statusText}
              </p>
            ) : null}
          </form>
        </>
      )}
    </div>
  )
}
