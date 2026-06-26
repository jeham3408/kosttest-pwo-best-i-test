import { listedProducts, testedProducts, type ListedProduct } from '../data/pwoProducts'

const testedIds = new Set(testedProducts.map((product) => product.id))

const statusClass: Record<ListedProduct['status'], string> = {
  Rangert: 'status-ranked',
  'Ikke rangert': 'status-pending',
  Koffeinfri: 'status-stimfree',
  Multipakke: 'status-bundle',
}

export default function UnrankedProductsSection() {
  const pending = listedProducts.filter(
    (product) => product.status !== 'Rangert' && !testedIds.has(product.id),
  )

  if (!pending.length) return null

  return (
    <section className="content-section" id="venter-rangering">
      <div className="section-heading">
        <span>Kartlagt</span>
        <h2>{pending.length} produkter ventar dosekontroll</h2>
        <p>
          Desse er funne i norske butikkar, men er ikkje rangert enno fordi vi manglar full
          deklarasjon eller manuell verifisering av per-dose-innhold.
        </p>
      </div>
      <div className="table-shell">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Produkt</th>
              <th>Status</th>
              <th>Grunn</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((product) => (
              <tr key={product.id}>
                <td className="product-cell">
                  <div>
                    <span>{product.name}</span>
                    <span>
                      {product.brand} · {product.merchant}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={statusClass[product.status]}>{product.status}</span>
                </td>
                <td>{product.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
