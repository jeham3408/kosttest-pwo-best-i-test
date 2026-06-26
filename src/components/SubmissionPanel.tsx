import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import { ScanLine, Upload } from 'lucide-react'

type ScanResponse = {
  status?: 'ok' | 'raw' | 'needs_api_key'
  message?: string
  parsed?: {
    productName?: string
    brand?: string
    ingredients?: unknown[]
  }
  raw?: string
  error?: string
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Kunne ikkje lese bilde som data-URL.'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Kunne ikkje lese bilde.'))
    reader.readAsDataURL(file)
  })

const numberFromInput = (value: string) => {
  const number = Number(value.replace(',', '.').trim())
  return Number.isFinite(number) ? number : null
}

export default function SubmissionPanel() {
  const [productName, setProductName] = useState('')
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [servings, setServings] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [saved, setSaved] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState('')

  const readiness = useMemo(() => {
    const completed = [productName, brand, price, servings, fileName].filter(Boolean).length
    return Math.round((completed / 5) * 100)
  }, [brand, fileName, price, productName, servings])

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file ?? null)
    setFileName(file?.name ?? '')
    setSaved(false)
    setScanMessage('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = {
      productName,
      brand,
      price: numberFromInput(price),
      servings: numberFromInput(servings),
      fileName,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('kosttest-pwo-submission-draft', JSON.stringify(payload))
    setSaved(true)

    if (!selectedFile) {
      setScanMessage('Utkastet er lagra lokalt. Legg ved bilde av baksida for AI-skanning.')
      return
    }

    setIsScanning(true)
    setScanMessage('Les bilde og sender til AI-skanning...')

    try {
      const imageDataUrl = await fileToDataUrl(selectedFile)
      const response = await fetch('/api/scan-pwo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, imageDataUrl }),
      })
      const result = (await response.json()) as ScanResponse

      if (!response.ok) {
        setScanMessage(`Skanning feila: ${result.error ?? 'ukjent feil'}. Utkastet er lagra lokalt.`)
        return
      }

      if (result.status === 'needs_api_key') {
        setScanMessage(result.message ?? 'OPENAI_API_KEY manglar. Utkastet er lagra lokalt.')
        return
      }

      if (result.status === 'ok') {
        const ingredientCount = result.parsed?.ingredients?.length ?? 0
        const scannedName = result.parsed?.productName || productName || 'produktet'
        setScanMessage(
          `AI-skanning ferdig for ${scannedName}: ${ingredientCount} ingrediensar funne. Klar for manuell kontroll før publisering.`,
        )
        return
      }

      setScanMessage('AI fann tekst, men ikkje strukturert JSON. Utkastet er lagra for manuell kontroll.')
    } catch {
      setScanMessage('Utkastet er lagra lokalt. AI-skanning køyrer på Vercel når API og OPENAI_API_KEY er klart.')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <section className="submission-section" id="bidra">
      <div className="section-heading">
        <span>Bidra</span>
        <h2>Send inn ein ny PWO</h2>
        <p>
          Målet er at alle skal kunne skrive inn produktet, ta bilde av baksida og la AI lese
          næringstabellen. Når API-nøkkelen er aktivert, går innsendinga gjennom same opne
          karaktermotor.
        </p>
      </div>

      <div className="submission-layout">
        <form className="submission-form" onSubmit={handleSubmit}>
          <label>
            Produktnamn
            <input value={productName} onChange={(event) => setProductName(event.target.value)} />
          </label>
          <label>
            Merke
            <input value={brand} onChange={(event) => setBrand(event.target.value)} />
          </label>
          <label>
            Pris
            <input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
          </label>
          <label>
            Porsjonar
            <input inputMode="numeric" value={servings} onChange={(event) => setServings(event.target.value)} />
          </label>
          <label className="file-input">
            Bilde av baksida
            <input accept="image/*" capture="environment" type="file" onChange={handleFile} />
            <span>
              <Upload size={16} />
              {fileName || 'Vel bilde'}
            </span>
          </label>
          <button className="button primary" type="submit">
            <ScanLine size={18} />
            {isScanning ? 'Skannar bilde...' : 'Klargjer for AI-skanning'}
          </button>
          {saved && <p className="saved-note">Forslaget er lagra lokalt som utkast.</p>}
          {scanMessage && <p className="saved-note">{scanMessage}</p>}
        </form>

        <div className="scan-flow">
          <strong>{readiness}% klar</strong>
          <div className="scorebar" aria-label={`${readiness}% klar`}>
            <span style={{ width: `${readiness}%` }} />
          </div>
          <ol>
            <li>AI les ingrediensar, mg, porsjonar og pris frå bilde/tekst.</li>
            <li>Citrulline-form blir normalisert til L-citrulline-ekvivalent.</li>
            <li>Regelmotoren gir F-A per ingrediens og reknar totalpoeng.</li>
            <li>Produktet blir lagt inn i rangeringa med kjelde og kontrollspor.</li>
          </ol>
        </div>
      </div>
    </section>
  )
}
