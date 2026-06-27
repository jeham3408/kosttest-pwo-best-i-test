import { useMemo } from 'react'
import { testedProteinProducts, type TestedProteinProduct } from '../data/proteinProducts'

const brandColor = (brand: string): string => {
  const colors: Record<string, string> = {
    Dymatize: '#1a5276', 'Optimum Nutrition': '#1f618d', Bodylab: '#2e86c1',
    'Star Nutrition': '#1a5276', MyProtein: '#0e6655', 'Scitec Nutrition': '#7d3c98',
    'Applied Nutrition': '#1a5276', Mutant: '#d35400', 'Rule 1': '#2c3e50',
    MuscleTech: '#922b21', 'Kevin Levrone': '#34495e', Ghost: '#6c3483',
    ESN: '#117a65', 'BioTech USA': '#27ae60', Weider: '#c0392b',
    Proteinfabrikken: '#1f1f1f', SmartSupps: '#5dade2', BSN: '#922b21',
    Olimp: '#1b4332', QNT: '#2874a6', 'Protein Series': '#566573',
    NutriTac: '#1a6e5c', Peveo: '#2d6a4f', Bulk: '#148f77',
  }
  return colors[brand] || '#116149'
}

export default function ProteinLeaderboardSection({
  onSelectProduct,
  products = testedProteinProducts,
}: {
  onSelectProduct: (id: string) => void
  products?: TestedProteinProduct[]
}) {
  const lb = useMemo(() => {
    const pool = products.length ? products : testedProteinProducts
    const byScore = [...pool].sort((a, b) => b.score - a.score || a.pricePerGramProtein - b.pricePerGramProtein).slice(0, 10)
    const maxScore = Math.max(...byScore.map((p) => p.score), 10)
    const byDiaas = [...pool].sort((a, b) => b.diaasScore - a.diaasScore).slice(0, 10)
    const maxDiaas = Math.max(...byDiaas.map((p) => p.diaasScore), 100)
    const byIaas = [...pool].sort((a, b) => b.iaasScore - a.iaasScore).slice(0, 10)
    const maxIaas = Math.max(...byIaas.map((p) => p.iaasScore), 100)
    const byPrice = [...pool]
      .filter((p) => isFinite(p.pricePerGramProtein))
      .sort((a, b) => a.pricePerGramProtein - b.pricePerGramProtein)
      .slice(0, 10)
    const maxPrice = byPrice.length ? Math.max(...byPrice.map((p) => p.pricePerGramProtein)) : 1
    return { byScore, byDiaas, byIaas, byPrice, maxScore, maxDiaas, maxIaas, maxPrice }
  }, [products])

  return (
    <section className="lb-section">
      <div className="lb-grid lb-grid-4">
        {[
          { items: lb.byScore, label: '🏆 Totalscore', vFn: (p: TestedProteinProduct) => p.score, fFn: (p: TestedProteinProduct) => String(p.score), maxV: lb.maxScore, barC: (p: TestedProteinProduct) => brandColor(p.brand), isPrice: false },
          { items: lb.byDiaas, label: '🧬 DIAAS ★', vFn: (p: TestedProteinProduct) => p.diaasScore, fFn: (p: TestedProteinProduct) => String(p.diaasScore), maxV: lb.maxDiaas, barC: () => '#116149', isPrice: false, highlight: true },
          { items: lb.byIaas, label: '📊 IAAS', vFn: (p: TestedProteinProduct) => p.iaasScore, fFn: (p: TestedProteinProduct) => String(p.iaasScore), maxV: lb.maxIaas, barC: () => '#7f8c8d', isPrice: false },
          { items: lb.byPrice, label: '💰 Pris per g protein', barC: () => '#d27c22', vFn: (p: TestedProteinProduct) => Math.round((1 - p.pricePerGramProtein / lb.maxPrice) * 80) + 10, fFn: (p: TestedProteinProduct) => p.pricePerGramProtein.toFixed(2).replace('.', ','), maxV: 90, isPrice: true },
        ].map((chart) => {
          const b = chart.isPrice ? 10 : chart.maxV > 50 ? 50 : 10
          const scale = chart.items.length ? 92 / ((chart.maxV as number) - b) : 1
          return (
            <div key={chart.label} className="lb-col" style={chart.highlight ? { border: '2px solid var(--accent)', borderRadius: 8 } : undefined}>
              <h3>{chart.label}</h3>
              <p className="lb-desc">{chart.highlight ? 'Primær kvalitetsmåling i scoren.' : 'Klikk på søyle for detaljar.'}</p>
              <div className="lb-chart-wrap">
                <div className="lb-vbars">
                  {chart.items.map((p) => {
                    const val = chart.vFn(p)
                    const barPct = Math.min(Math.max((val - b) * scale, 3), 96)
                    const name = p.brand.length <= 10 ? p.brand : p.brand.split(' ')[0]
                    return (
                      <button key={p.id} className="lb-vcol" onClick={() => onSelectProduct(p.id)}>
                        {chart.isPrice ? <span className="lb-vscore-top">{chart.fFn(p)}</span> : null}
                        <span className="lb-vbar-wrap">
                          <span className="lb-vbar" style={{ height: `${barPct}%`, background: chart.barC(p) }}>
                            {!chart.isPrice ? <span className="lb-vscore-onbar">{chart.fFn(p)}</span> : null}
                          </span>
                        </span>
                        <span className="lb-vname"><span>{name}</span><span>{p.name.split(' ').slice(0, 2).join(' ')}</span></span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
