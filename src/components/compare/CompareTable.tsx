import type { CompareCell, CompareFieldDef, CompareProductHeader } from '../../compare/types'
import { computeRowHighlight, highlightLabel } from '../../compare/highlight'

type CompareTableProps<T extends CompareProductHeader> = {
  fields: CompareFieldDef<T>[]
  products: T[]
  getCellValue: (field: CompareFieldDef<T>, product: T) => CompareCell
}

function CompareCellView({
  cell,
  highlight,
}: {
  cell: CompareCell
  highlight: 'best' | 'worst' | null
}) {
  const hl = highlight ? highlightLabel(highlight) : null
  return (
    <span
      className={`compare-cell compare-cell--${cell.kind}${highlight ? ` compare-cell--${highlight}` : ''}`}
      aria-label={cell.ariaLabel ?? cell.display}
    >
      {hl ? (
        <span className="compare-cell-marker" aria-hidden="true">
          {hl.symbol}
        </span>
      ) : null}
      <span className="compare-cell-text">{cell.display}</span>
      {hl ? <span className="compare-cell-hint">{hl.text}</span> : null}
    </span>
  )
}

export default function CompareTable<T extends CompareProductHeader>({
  fields,
  products,
  getCellValue,
}: CompareTableProps<T>) {
  return (
    <div className="compare-table-shell" role="region" aria-label="Sammenligningstabell">
      <table className="compare-table">
        <caption className="sr-only">
          Side om side sammenligning av {products.length} produkt
        </caption>
        <thead>
          <tr>
            <th scope="col">Kriterium</th>
            {products.map((p) => (
              <th key={p.id} scope="col">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => {
            const values = products.map((p) => getCellValue(field, p))
            const rowHighlight = computeRowHighlight(field, products, values)
            return (
              <tr key={field.key}>
                <th scope="row">{field.label}</th>
                {values.map((cell, index) => {
                  let highlight: 'best' | 'worst' | null = null
                  if (rowHighlight?.best.includes(index)) highlight = 'best'
                  else if (rowHighlight?.worst.includes(index)) highlight = 'worst'
                  return (
                    <td key={`${field.key}-${products[index].id}`}>
                      <CompareCellView cell={cell} highlight={highlight} />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
