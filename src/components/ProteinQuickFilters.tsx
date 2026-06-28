const WHEY_SOURCES =
  'whey-isolate,whey-concentrate,whey-blend,hydrolyzed-whey,clear-whey'

const needShortcuts = [
  {
    label: 'Best verdi',
    path: '/tester/protein/?preset=value',
    hint: 'DIAAS-estimat ≥ 90 og god pris per gram protein (karakter A–C) — alle proteintyper.',
  },
  {
    label: 'Best verdi blant whey',
    path: `/tester/protein/?preset=value&source=${WHEY_SOURCES}`,
    hint: 'DIAAS-estimat ≥ 90, whey, god pris per gram protein og minst 70 g protein/100 g.',
  },
  {
    label: 'Laktosefri',
    path: '/tester/protein/?lactoseFree=1',
    hint: 'Kun produkter dokumentert som laktosefri eller laktosefattig — ikke antatt fra isolate.',
  },
  {
    label: 'Vegansk',
    path: '/tester/protein/vegan/',
    hint: 'Plantebaserte alternativer — DIAAS-estimat er ikke direkte likt whey.',
  },
  {
    label: 'Lavest pris per gram protein',
    path: '/tester/protein/billigste/',
    hint: 'Sortert på pris per gram protein. DIAAS-rangering vises fortsatt separat.',
  },
  {
    label: 'Mest protein per kalori',
    path: '/tester/protein/?minProtKcal=9',
    hint: 'Krever oppgitte kalorier per produkt. Få produkter har dette feltet fylt inn.',
  },
  {
    label: 'Uten søtstoff',
    path: '/tester/protein/?sweetenerFree=1',
    hint: 'Kun der produsent/butikk dokumenterer søtstofffritt — vi gjetter ikke.',
  },
  {
    label: 'Nøytral til baking/matlaging',
    path: '/tester/protein/?flavor=noytral',
    hint: 'Nøytral smak eller markert egnet til baking der det er dokumentert.',
  },
  {
    label: 'Høyest datakvalitet',
    path: '/tester/protein/?data=high',
    hint: 'Produkter med mest komplett deklarasjon og kontrollert produktdata.',
  },
] as const

export default function ProteinQuickFilters({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section className="protein-need-shortcuts" aria-labelledby="protein-need-heading">
      <div className="section-heading section-heading--compact" style={{ marginBottom: 10 }}>
        <span>Velg etter behov</span>
        <h2 id="protein-need-heading" style={{ fontSize: 18, margin: '4px 0 6px' }}>
          Finn protein etter det som betyr noe for deg
        </h2>
        <p style={{ fontSize: 13, margin: 0, lineHeight: 1.55 }}>
          Snarveiene bruker faktiske filtre i URL-en — du kan dele lenken. DIAAS, pris og toleranse er separate valg.
        </p>
      </div>
      <nav className="quick-filter-bar protein-need-grid" aria-label="Velg protein etter behov">
        {needShortcuts.map((item) => (
          <button
            key={item.path}
            type="button"
            className="quick-filter-chip protein-need-chip"
            title={item.hint}
            aria-describedby={`hint-${item.label.replace(/\s+/g, '-')}`}
            onClick={() => onNavigate(item.path)}
          >
            <span className="protein-need-chip-label">{item.label}</span>
            <span className="protein-need-chip-hint" id={`hint-${item.label.replace(/\s+/g, '-')}`}>
              {item.hint}
            </span>
          </button>
        ))}
      </nav>
    </section>
  )
}
