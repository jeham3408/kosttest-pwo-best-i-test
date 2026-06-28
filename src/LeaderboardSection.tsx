import { useMemo } from 'react'
import { testedProducts, type TestedProduct } from './data/pwoProducts'

const brandColor = (brand: string): string => {
  const colors: Record<string, string> = {
    Peveo: '#2d6a4f', 'Star Nutrition': '#1a5276', 'Optimum Nutrition': '#1f618d',
    BSN: '#922b21', Cellucor: '#e67e22', 'Applied Nutrition': '#1a5276',
    'Chained Nutrition': '#7d3c98', Bodylab: '#2e86c1', 'Lean Lime': '#229954',
    'White Lion': '#f39c12', 'Swedish Supplements': '#c0392b',
    NutriTac: '#1a6e5c', Mutant: '#d35400', 'JNX Sports': '#2c3e50',
    'Olimp Sports Nutrition': '#34495e', 'Proteinfabrikken': '#1f1f1f',
    SmartSupps: '#5dade2', 'Stacker2 Europe': '#e74c3c', 'Elit Nutrition': '#2e4053',
    BioSalma: '#27ae60', 'Physique Enhancing Science': '#5b2c6f',
    'Näno Supps': '#1b4f72', DNS: '#1a5276', 'AK47 Labs': '#922b21',
    Zoomad: '#117a65', QNT: '#2874a6', 'USP Labs': '#6c3483',
    'Trec Nutrition': '#1b4332', 'Good4Nutrition': '#0e6655',
    'MyRevolution': '#1a5276', Ghost: '#6c3483', 'Tommi Nutrition': '#e67e22',
    'Up North Labz': '#148f77', Naturecan: '#27ae60', 'ProSupps': '#dc7633',
    'SNS Biotech': '#2c3e50', Evolite: '#566573', Exercise: '#717d7e',
  }
  return colors[brand] || '#116149'
}

export default function LeaderboardSection({ kgPrice, onSelectProduct }: { kgPrice: (p: TestedProduct) => number; onSelectProduct: (id: string) => void }) {
  const lb = useMemo(() => {
    const withCaf = testedProducts.filter(p => (p.caffeineMg ?? 0) > 0).sort((a, b) => b.score - a.score || a.pricePerServing - b.pricePerServing).slice(0, 10)
    const maxCaf = Math.max(...withCaf.map(p => p.score), 10)
    const noCaf = testedProducts.filter(p => !p.caffeineMg || p.caffeineMg === 0).sort((a, b) => b.score - a.score || a.pricePerServing - b.pricePerServing)
    const maxNo = Math.max(...noCaf.map(p => p.score), 10)
    const prCaf = testedProducts.filter(p => (p.caffeineMg ?? 0) > 0 && isFinite(kgPrice(p))).sort((a, b) => kgPrice(b) - kgPrice(a)).slice(0, 10)
    const maxPrCaf = prCaf.length ? Math.max(...prCaf.map(kgPrice)) : 1
    const prNo = testedProducts.filter(p => (!p.caffeineMg || p.caffeineMg === 0) && isFinite(kgPrice(p))).sort((a, b) => kgPrice(b) - kgPrice(a)).slice(0, 10)
    const maxPrNo = prNo.length ? Math.max(...prNo.map(kgPrice)) : 1
    return { withCaf, noCaf, prCaf, prNo, maxCaf, maxNo, maxPrCaf, maxPrNo }
  }, [kgPrice])

  return (
    <section className="lb-section">
      <div className="lb-grid">
        {[
          { items: lb.withCaf, label: 'Formelscore med koffein', barC: (p: TestedProduct) => brandColor(p.brand), vFn: (p: TestedProduct) => p.score, fFn: (p: TestedProduct) => String(p.score), maxV: lb.maxCaf },
          { items: lb.noCaf, label: 'Formelscore uten koffein', barC: (p: TestedProduct) => brandColor(p.brand), vFn: (p: TestedProduct) => p.score, fFn: (p: TestedProduct) => String(p.score), maxV: lb.maxNo },
          { items: lb.prCaf, label: 'Pris med koffein', barC: () => '#d27c22', vFn: (p: TestedProduct) => Math.round(kgPrice(p) / lb.maxPrCaf * 80) + 10, fFn: (p: TestedProduct) => Math.round(kgPrice(p)).toLocaleString('nb-NO'), maxV: 90 },
          { items: lb.prNo, label: 'Pris uten koffein', barC: () => '#d27c22', vFn: (p: TestedProduct) => Math.round(kgPrice(p) / lb.maxPrNo * 80) + 10, fFn: (p: TestedProduct) => Math.round(kgPrice(p)).toLocaleString('nb-NO'), maxV: 90 },
        ].map(chart => {
          const b = 10
          const scale = chart.items.length ? 92 / (chart.maxV - b) : 1
          return (
            <div key={chart.label} className="lb-col">
              <h3>{chart.label}</h3>
              <p className="lb-desc">Klikk på søyle for detaljer.</p>
              <div className="lb-chart-wrap">
                <div className="lb-vbars">
                  {chart.items.map(p => {
                    const barPct = Math.min(Math.max((chart.vFn(p) - b) * scale, 3), 96)
                    const name = p.brand.length <= 8 ? p.brand : (p.brand.split(' ')[0] || p.brand)
                    const pname = p.name.split(' ').slice(0, 2).join(' ').replace(name, '').trim()
                    const isPrice = chart.label.startsWith('💰')
                    return (
                      <button key={p.id} className="lb-vcol" onClick={() => onSelectProduct(p.id)}>
                        {isPrice ? <span className="lb-vscore-top">{chart.fFn(p)}</span> : null}
                        <span className="lb-vbar-wrap">
                          <span className="lb-vbar" style={{ height: `${barPct}%`, background: chart.barC(p) }}>
                            {!isPrice ? <span className="lb-vscore-onbar">{chart.fFn(p)}</span> : null}
                          </span>
                        </span>
                        <span className="lb-vname"><span>{name}</span><span>{pname || p.name.split(' ').slice(0, 2).join(' ')}</span></span>
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
