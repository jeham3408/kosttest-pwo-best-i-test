import FilterPanelShell from '../ui/FilterPanelShell'
import type { CreatineDataConfidenceLevel } from '../../data/creatine/dataConfidence'
import {
  countActiveCreatineFilters,
  type CreatineFilterState,
} from '../../data/creatine/filters'

type CreatineFilterBarProps = {
  filters: CreatineFilterState
  onChange: (next: CreatineFilterState) => void
  onReset: () => void
  resultCount: number
  totalCount: number
}

const dataOptions: { value: CreatineDataConfidenceLevel; label: string }[] = [
  { value: 'high', label: 'Høy data' },
  { value: 'medium', label: 'Middels data' },
  { value: 'low', label: 'Lav data' },
]

export default function CreatineFilterBar({
  filters,
  onChange,
  onReset,
  resultCount,
  totalCount,
}: CreatineFilterBarProps) {
  const active = countActiveCreatineFilters(filters)
  const patch = (partial: Partial<CreatineFilterState>) => onChange({ ...filters, ...partial, preset: null })

  return (
    <FilterPanelShell
      className="pwo-filter-panel creatine-filter-panel"
      title="Filter kreatin"
      activeCount={active}
      resultCount={resultCount}
      totalCount={totalCount}
      onReset={active > 0 ? onReset : undefined}
    >
      <div className="filter-bar pwo-filter-bar creatine-filter-bar" role="group" aria-label="Kreatinfilter">
        <span className="filter-label">Råvare:</span>
        {([
          { value: 'alle', label: 'Alle' },
          { value: 'creapure', label: 'Creapure' },
          { value: 'branded', label: 'Merkevare' },
          { value: 'generic', label: 'Generisk mono' },
        ] as const).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`toggle-btn ${filters.rawMaterial === value ? 'on' : 'off'}`}
            onClick={() => patch({ rawMaterial: value })}
          >
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span className="toggle-label">{label}</span>
          </button>
        ))}

        <button
          type="button"
          className={`toggle-btn ${filters.dopingDocumented ? 'on' : 'off'}`}
          onClick={() => patch({ dopingDocumented: !filters.dopingDocumented })}
        >
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span className="toggle-label">Doping dokumentert</span>
        </button>

        <button
          type="button"
          className={`toggle-btn ${filters.purityDocumented ? 'on' : 'off'}`}
          onClick={() => patch({ purityDocumented: !filters.purityDocumented })}
        >
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span className="toggle-label">Renhet oppgitt</span>
        </button>

        <button
          type="button"
          className={`toggle-btn ${filters.meshDocumented ? 'on' : 'off'}`}
          onClick={() => patch({ meshDocumented: !filters.meshDocumented })}
        >
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span className="toggle-label">Mesh oppgitt</span>
        </button>

        <button
          type="button"
          className={`toggle-btn ${filters.monohydrateOnly ? 'on' : 'off'}`}
          onClick={() => patch({ monohydrateOnly: !filters.monohydrateOnly })}
        >
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span className="toggle-label">Monohydrat</span>
        </button>

        <span className="filter-label">Snarvei:</span>
        {([
          { key: 'value', label: 'Best verdi' },
          { key: 'budget', label: 'Budsjett' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`quick-filter-chip${filters.preset === key ? ' is-active' : ''}`}
            onClick={() => onChange({ ...filters, preset: filters.preset === key ? null : key })}
          >
            {label}
          </button>
        ))}

        <span className="filter-label">Min score:</span>
        {([null, 40, 75, 85] as const).map((min) => (
          <button
            key={String(min)}
            type="button"
            className={`quick-filter-chip${filters.scoreMin === min ? ' is-active' : ''}`}
            onClick={() => patch({ scoreMin: filters.scoreMin === min ? null : min })}
          >
            {min == null ? 'Alle' : `≥ ${min}`}
          </button>
        ))}

        <span className="filter-label">Maks kr/g:</span>
        <input
          type="number"
          min={0}
          step={0.05}
          placeholder="f.eks. 0,5"
          value={filters.maxPricePerGram ?? ''}
          onChange={(e) => patch({ maxPricePerGram: e.target.value ? Number(e.target.value) : null })}
          className="pwo-filter-input"
        />

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
