import { type FormEvent, useId, useState } from 'react'
import { Check, MessageSquarePlus, Send } from 'lucide-react'

export type FeedbackType = 'missing_product' | 'product_error' | 'test_improvement' | 'other'

type FeedbackResponse = {
  ok?: boolean
  id?: string
  message?: string
  error?: string
}

type FeedbackTypeOption = {
  value: FeedbackType
  label: string
  description: string
}

const typeOptions: FeedbackTypeOption[] = [
  {
    value: 'missing_product',
    label: 'Mangler vi et produkt',
    description: 'Foreslå et kosttilskudd som bør testes og rangertes.',
  },
  {
    value: 'product_error',
    label: 'Har vi skrevet feil om et produkt',
    description: 'Rapporter feil i ingredienser, doser, pris eller annen produktinfo.',
  },
  {
    value: 'test_improvement',
    label: 'Forslag til forbedring av testen',
    description: 'Idéer til scoring, flere produkter, nye kolonner eller tydeligere metode.',
  },
  {
    value: 'other',
    label: 'Annet om testen',
    description: 'Andre spørsmål eller innspill som ikke passer kategoriene over.',
  },
]

const needsProductName = (type: FeedbackType) => type === 'missing_product' || type === 'product_error'
const needsCategory = (type: FeedbackType) => type !== 'other'

export default function FeedbackBar() {
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('missing_product')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('pwo')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [statusText, setStatusText] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (honeypot.trim()) return

    const trimmedMessage = message.trim()
    const trimmedName = name.trim()

    if (trimmedMessage.length < 10) {
      setStatus('error')
      setStatusText('Skriv minst 10 tegn i meldingen.')
      return
    }

    if (needsProductName(type) && trimmedName.length < 2) {
      setStatus('error')
      setStatusText('Oppgi navnet på produktet det gjelder.')
      return
    }

    setStatus('sending')
    setStatusText('')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name: trimmedName,
          category: needsCategory(type) ? category : null,
          message: trimmedMessage,
          email: email.trim() || null,
          sourcePage: window.location.pathname,
          website: honeypot,
        }),
      })

      const result = (await response.json()) as FeedbackResponse

      if (!response.ok || !result.ok) {
        setStatus('error')
        setStatusText(result.error ?? result.message ?? 'Kunne ikke sende meldingen. Prøv igjen senere.')
        return
      }

      setStatus('sent')
      setStatusText(result.message ?? 'Takk! Vi vurderer forslaget og tar det med i testkøen.')
      setName('')
      setMessage('')
      setEmail('')
    } catch {
      setStatus('error')
      setStatusText('Nettverksfeil. Sjekk tilkoblingen og prøv igjen.')
    }
  }

  return (
    <section className="feedback-bar" aria-labelledby={`${formId}-title`}>
      <div className="feedback-bar-inner">
        <div className="feedback-bar-intro">
          <MessageSquarePlus size={20} aria-hidden="true" />
          <div>
            <h2 id={`${formId}-title`}>Mangler vi et produkt?</h2>
            <p>
              Vi rangerer kun kosttilskudd — ikke butikker. Alle kan sende inn uten konto.
              Si ifra om et produkt mangler, om vi har skrevet feil, om du har forslag til testen, eller andre innspill.
            </p>
          </div>
          {!open && (
            <button type="button" className="button feedback-toggle" onClick={() => setOpen(true)}>
              Send melding
            </button>
          )}
        </div>

        {open && (
          <form className="feedback-form" onSubmit={handleSubmit} noValidate>
            <fieldset className="feedback-type-group" role="radiogroup" aria-label="Hva gjelder det?">
              <legend>Hva gjelder det?</legend>
              {typeOptions.map(({ value, label, description }) => {
                const selected = type === value
                return (
                  <div
                    key={value}
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    className={`feedback-type-option${selected ? ' is-selected' : ''}`}
                    onClick={() => setType(value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setType(value)
                      }
                    }}
                  >
                    <span className="feedback-type-copy">
                      <strong>{label}</strong>
                      <span>{description}</span>
                    </span>
                    <span className="feedback-type-check" aria-hidden="true">
                      {selected && <Check size={14} strokeWidth={3} />}
                    </span>
                  </div>
                )
              })}
            </fieldset>

            {needsProductName(type) && (
              <label>
                {type === 'product_error' ? 'Hvilket produkt gjelder det?' : 'Produktnavn'}
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={
                    type === 'product_error'
                      ? 'F.eks. SmartSupps PWO eller Gold Standard Whey'
                      : 'F.eks. Applied ABE Ultimate eller Optimum Gold Standard'
                  }
                  required
                  maxLength={200}
                />
              </label>
            )}

            {needsCategory(type) && (
              <label>
                {type === 'test_improvement' ? 'Hvilken test?' : 'Kategori'}
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="pwo">Pre-workout (PWO)</option>
                  <option value="protein">Proteinpulver</option>
                  <option value="kreatin">Kreatin</option>
                  <option value="annet">Annet tilskudd</option>
                </select>
              </label>
            )}

            <label>
              Melding
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                  type === 'product_error'
                    ? 'Beskriv hva som er feil — f.eks. feil koffeinmengde, citrullin-form eller pris. Lenke til produktsiden hjelper.'
                    : type === 'missing_product'
                      ? 'Beskriv produktet, gjerne med lenke til produktsiden og merke om du vet det.'
                      : type === 'test_improvement'
                        ? 'F.eks. nye kolonner i tabellen, annen scoring, flere produkter i testen, eller bedre forklaring av metoden.'
                        : 'Skriv spørsmålet eller innspillet ditt her.'
                }
                rows={4}
                required
                maxLength={2000}
              />
            </label>

            <label>
              E-post (valgfritt)
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="valgfri@epost.no"
                autoComplete="email"
                maxLength={120}
              />
            </label>

            <label className="feedback-honeypot" aria-hidden="true">
              Nettsted
              <input
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
              />
            </label>

            <div className="feedback-actions">
              <button className="button primary" type="submit" disabled={status === 'sending'}>
                <Send size={16} />
                {status === 'sending' ? 'Sender…' : 'Send inn'}
              </button>
              <button
                type="button"
                className="button feedback-cancel"
                onClick={() => {
                  setOpen(false)
                  setStatus('idle')
                  setStatusText('')
                }}
              >
                Lukk
              </button>
            </div>

            {statusText && (
              <p className={`feedback-status feedback-status-${status}`} role="status">
                {statusText}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
