import { useMemo } from 'react'
import { testedCreatineProducts, type TestedCreatineProduct } from '../data/creatineProducts'

const brandColor = (brand: string): string => {
  const colors: Record<string, string> = {
    'Star Nutrition': '#1a5276', SmartSupps: '#5dade2', 'Optimum Nutrition': '#1f618d',
    Mutant: '#d35400', ELIT: '#2e86c1', 'Applied Nutrition': '#1a5276',
  }
  return colors[brand] || '#116149'
}

export default function CreatineLeaderboardSection({
  onSelectProduct,
}: {
  onSelectProduct: (id: string) => void
}) {
  const lb = useMemo(() => {
    const byScore = [...testedCreatineProducts].sort((a, b) => b.score - a.score).slice(0, 8)
    const maxScore = Math.max(...byScore.map((p) => p.score), 10)
    const byDose = [...testedCreatineProducts].sort((a, b) => b.creatineMgPerServing - a.creatineMgPerServing).slice(0, 8)
    const maxDose = Math.max(...byDose.map((p) => p.creatineMgPerServing), 5000)
    const byPrice = [...testedCreatineProducts]
      .filter((p) => isFinite(p.pricePerGramCreatine))
      .sort((a, b) => a.pricePerGramCreatine - b.pricePerGramCreatine)
      .slice(0, 8)
    const maxPrice = byPrice.length ? Math.max(...byPrice.map((p) => p.pricePerGramCreatine)) : 1
    return { byScore, byDose, byPrice, maxScore, maxDose, maxPrice }
  }, [])

  return (
    <section className="lb-section">
      <div className="lb-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { items: lb.byScore, label: '🏆 Totalscore', vFn: (p: TestedCreatineProduct) => p.score, fFn: (p: TestedCreatineProduct) => String(p.score), maxV: lb.maxScore, barC: (p: TestedCreatineProduct) => brandColor(p.brand), isPrice: false },
          { items: lb.byDose, label: '💪 Dose', vFn: (p: TestedCreatineProduct) => p.creatineMgPerServing, fFn: (p: TestedCreatineProduct) => `${p.creatineMgPerServing} mg`, maxV: lb.maxDose, barC: () => '#116149', isPrice: false, highlight: true },
          { items: lb.byPrice, label: '💰 Pris per g', barC: () => '#d27c22', vFn: (p: TestedCreatineProduct) => Math.round((1 - p.pricePerGramCreatine / lb.maxPrice) * 80) + 10, fFn: (p: TestedCreatineProduct) => p.pricePerGramCreatine.toFixed(2).replace('.', ','), maxV: 90, isPrice: true },
        ].map((chart) => {
          const b = chart.isPrice ? 10 : chart.maxV > 50 ? 50 : 10
          const scale = chart.items.length ? 92 / ((chart.maxV as number) - b) : 1
          return (
            <div key={chart.label} className="lb-col" style={chart.highlight ? { border: '2px solid var(--accent)', borderRadius: 8 } : undefined}>
              <h3>{chart.label}</h3>
              <p className="lb-desc">{chart.highlight ? '3–5 g per dose = optimalt.' : 'Klikk på søyle for detaljer.'}</p>
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
                        <span className="lb-vname"><span>{name}</span><span>{p.formatType === 'gummies' ? 'Gummies' : 'Pulver'}</span></span>
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
