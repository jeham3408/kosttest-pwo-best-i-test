import FilterPanelShell from '../ui/FilterPanelShell'
import type { ProteinDataConfidenceLevel } from '../../data/protein/dataConfidence'
import {
  countActiveProteinFilters,
  type ProteinFilterState,
} from '../../data/protein/filters'
import type { ProteinSourceType } from '../../data/proteinScoring'

type ProteinFilterBarProps = {
  filters: ProteinFilterState
  onChange: (next: ProteinFilterState) => void
  onReset: () => void
  resultCount: number
  totalCount: number
}

const sourceOptions: { value: ProteinSourceType; label: string }[] = [
  { value: 'whey-isolate', label: 'Whey isolate' },
  { value: 'whey-concentrate', label: 'Whey concentrate' },
  { value: 'whey-blend', label: 'Whey blend' },
  { value: 'hydrolyzed-whey', label: 'Hydrolysert whey' },
  { value: 'casein', label: 'Kasein' },
  { value: 'soy-isolate', label: 'Soya (vegan)' },
  { value: 'pea-rice-blend', label: 'Erte/ris (vegan)' },
  { value: 'clear-whey', label: 'Clear whey' },
]

const dataOptions: { value: ProteinDataConfidenceLevel; label: string }[] = [
  { value: 'high', label: 'Høy data' },
  { value: 'medium', label: 'Middels data' },
  { value: 'low', label: 'Lav data' },
]

export default function ProteinFilterBar({
  filters,
  onChange,
  onReset,
  resultCount,
  totalCount,
}: ProteinFilterBarProps) {
  const active = countActiveProteinFilters(filters)
  const patch = (partial: Partial<ProteinFilterState>) => onChange({ ...filters, ...partial, preset: null })

  const toggleSource = (value: ProteinSourceType) => {
    const has = filters.sourceTypes.includes(value)
    patch({
      sourceTypes: has ? filters.sourceTypes.filter((v) => v !== value) : [...filters.sourceTypes, value],
    })
  }

  return (
    <FilterPanelShell
      className="pwo-filter-panel protein-filter-panel"
      title="Filter protein"
      activeCount={active}
      resultCount={resultCount}
      totalCount={totalCount}
      onReset={active > 0 ? onReset : undefined}
    >
      <div className="filter-bar pwo-filter-bar protein-filter-bar" role="group" aria-label="Proteinfilter">
        <span className="filter-label">Proteintype:</span>
        {sourceOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`toggle-btn ${filters.sourceTypes.includes(o.value) ? 'on' : 'off'}`}
            onClick={() => toggleSource(o.value)}
          >
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span className="toggle-label">{o.label}</span>
          </button>
        ))}

        <span className="filter-label">Snarvei:</span>
        {([
          { key: 'value', label: 'Best verdi' },
          { key: 'budget', label: 'Budsjett' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`toggle-btn ${filters.preset === key ? 'on' : 'off'}`}
            onClick={() => onChange({ ...filters, preset: filters.preset === key ? null : key })}
          >
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span className="toggle-label">{label}</span>
          </button>
        ))}

        <span className="filter-label">DIAAS min:</span>
        {([null, 85, 90, 95] as const).map((min) => (
          <button
            key={String(min)}
            type="button"
            className={`quick-filter-chip${filters.diaasMin === min ? ' is-active' : ''}`}
            onClick={() => patch({ diaasMin: filters.diaasMin === min ? null : min })}
          >
            {min == null ? 'Alle' : `≥ ${min}`}
          </button>
        ))}

        <span className="filter-label">Maks kr/g:</span>
        <input
          type="number"
          min={0}
          step={0.05}
          placeholder="f.eks. 1,2"
          value={filters.maxPricePerGram ?? ''}
          onChange={(e) => patch({ maxPricePerGram: e.target.value ? Number(e.target.value) : null })}
          className="pwo-filter-input"
        />

        <button
          type="button"
          className={`toggle-btn ${filters.lactoseFreeOnly ? 'on' : 'off'}`}
          onClick={() => patch({ lactoseFreeOnly: !filters.lactoseFreeOnly })}
        >
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span className="toggle-label">Laktosefri (dok.)</span>
        </button>

        <button
          type="button"
          className={`toggle-btn ${filters.sweetenerFreeOnly ? 'on' : 'off'}`}
          onClick={() => patch({ sweetenerFreeOnly: !filters.sweetenerFreeOnly })}
        >
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span className="toggle-label">Uten søtstoff (dok.)</span>
        </button>

        <button
          type="button"
          className={`toggle-btn ${filters.flavorMode === 'noytral' ? 'on' : 'off'}`}
          onClick={() => patch({ flavorMode: filters.flavorMode === 'noytral' ? 'alle' : 'noytral' })}
        >
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span className="toggle-label">Nøytral smak</span>
        </button>

        <button
          type="button"
          className={`toggle-btn ${filters.diaasOfficialOnly ? 'on' : 'off'}`}
          onClick={() => patch({ diaasOfficialOnly: !filters.diaasOfficialOnly })}
        >
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span className="toggle-label">Labmålt DIAAS</span>
        </button>

        <span className="filter-label">Data:</span>
        {dataOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`toggle-btn ${filters.dataConfidence.includes(o.value) ? 'on' : 'off'}`}
            onClick={() => {
              const has = filters.dataConfidence.includes(o.value)
              patch({
                dataConfidence: has
                  ? filters.dataConfidence.filter((v) => v !== o.value)
                  : [...filters.dataConfidence, o.value],
              })
            }}
          >
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span className="toggle-label">{o.label}</span>
          </button>
        ))}
      </div>
    </FilterPanelShell>
  )
}
