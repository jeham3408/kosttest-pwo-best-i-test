import type { GradeLetter } from '../../data/pwoProducts'
import type { DataConfidenceLevel } from '../../data/pwo/dataConfidence'
import {
  countActivePwoFilters,
  type PwoFilterState,
} from '../../data/pwo/filters'
import FilterPanelShell from '../ui/FilterPanelShell'

type PwoFilterBarProps = {
  filters: PwoFilterState
  onChange: (next: PwoFilterState) => void
  onReset: () => void
  resultCount: number
  totalCount: number
}

const priceGradeOptions: GradeLetter[] = ['A', 'B', 'C', 'D', 'E', 'F']
const dataOptions: { value: DataConfidenceLevel; label: string }[] = [
  { value: 'high', label: 'Høy data' },
  { value: 'medium', label: 'Middels data' },
  { value: 'low', label: 'Lav data' },
]

export default function PwoFilterBar({
  filters,
  onChange,
  onReset,
  resultCount,
  totalCount,
}: PwoFilterBarProps) {
  const active = countActivePwoFilters(filters)

  const patch = (partial: Partial<PwoFilterState>) => onChange({ ...filters, ...partial, preset: null })

  return (
    <FilterPanelShell
      className="pwo-filter-panel"
      title="Filter PWO"
      activeCount={active}
      resultCount={resultCount}
      totalCount={totalCount}
      onReset={active > 0 ? onReset : undefined}
    >
      <div className="filter-bar pwo-filter-bar" role="group" aria-label="PWO-filter">
        <span className="filter-label">Koffein:</span>
        {(['alle', 'med', 'uten'] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={`toggle-btn ${filters.caffeineMode === v ? 'on' : 'off'}`}
            onClick={() => patch({ caffeineMode: v })}
          >
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span className="toggle-label">{v === 'alle' ? 'Alle' : v === 'med' ? 'Med' : 'Uten'}</span>
          </button>
        ))}

        <span className="filter-label">Beta-alanin:</span>
        {(['med', 'uten'] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={`toggle-btn ${filters.betaAlanine === v ? 'on' : 'off'}`}
            onClick={() => patch({ betaAlanine: v })}
          >
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span className="toggle-label">{v === 'med' ? 'Med' : 'Uten'}</span>
          </button>
        ))}

        <span className="filter-label">Koffeinintervall:</span>
        {([
          { key: 'all', label: 'Alle', min: null as number | null, max: null as number | null },
          { key: 'low', label: '≤ 100 mg', min: 1, max: 100 },
          { key: 'mid', label: '≤ 200 mg', min: 1, max: 200 },
          { key: 'high', label: '≥ 250 mg', min: 250, max: null },
        ] as const).map(({ key, label, min, max }) => {
          const active = filters.caffeineMin === min && filters.caffeineMax === max
          return (
            <button
              key={key}
              type="button"
              className={`quick-filter-chip${active ? ' is-active' : ''}`}
              onClick={() =>
                patch({
                  caffeineMin: min,
                  caffeineMax: max,
                  caffeineMode: min === null && max === null ? filters.caffeineMode : 'med',
                })
              }
            >
              {label}
            </button>
          )
        })}

        <span className="filter-label">Formelscore:</span>
        {([null, 34, 46] as const).map((min) => (
          <button
            key={String(min)}
            type="button"
            className={`quick-filter-chip${filters.scoreMin === min ? ' is-active' : ''}`}
            onClick={() => patch({ scoreMin: min })}
          >
            {min == null ? 'Alle' : `≥ ${min}`}
          </button>
        ))}

        <span className="filter-label">Maks pris/dose:</span>
        {([null, 15, 20, 25] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            className={`quick-filter-chip${filters.maxPricePerDose === v ? ' is-active' : ''}`}
            onClick={() => patch({ maxPricePerDose: v })}
          >
            {v == null ? 'Alle' : `≤ ${v} kr`}
          </button>
        ))}

        <span className="filter-label">Verdikarakter:</span>
        {priceGradeOptions.slice(0, 4).map((g) => {
          const on = filters.priceGrades.includes(g)
          return (
            <button
              key={g}
              type="button"
              className={`quick-filter-chip${on ? ' is-active' : ''}`}
              onClick={() =>
                patch({
                  priceGrades: on ? filters.priceGrades.filter((x) => x !== g) : [...filters.priceGrades, g],
                })
              }
            >
              {g}
            </button>
          )
        })}

        <span className="filter-label">Data:</span>
        {dataOptions.map(({ value, label }) => {
          const on = filters.dataConfidence.includes(value)
          return (
            <button
              key={value}
              type="button"
              className={`quick-filter-chip${on ? ' is-active' : ''}`}
              onClick={() =>
                patch({
                  dataConfidence: on
                    ? filters.dataConfidence.filter((x) => x !== value)
                    : [...filters.dataConfidence, value],
                })
              }
            >
              {label}
            </button>
          )
        })}

        <button
          type="button"
          className={`toggle-btn ${filters.fullDeclarationOnly ? 'on' : 'off'}`}
          onClick={() => patch({ fullDeclarationOnly: !filters.fullDeclarationOnly })}
        >
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span className="toggle-label">Full deklarasjon</span>
        </button>
      </div>
    </FilterPanelShell>
  )
}

