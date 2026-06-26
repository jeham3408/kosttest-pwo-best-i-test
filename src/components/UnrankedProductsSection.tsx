import { listedProducts, type ListedProduct } from '../data/pwoProducts'

const statusClass: Record<ListedProduct['status'], string> = {
  Rangert: 'status-ranked',
  'Ikke rangert': 'status-pending',
  Koffeinfri: 'status-stimfree',
  Multipakke: 'status-bundle',
}

export default function UnrankedProductsSection() {
  const pending = listedProducts.filter((product) => product.status !== 'Rangert')

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
                  {product.image && (
                    <div className="product-image">
                      <img
                        src={product.image}
                        alt={`${product.name} – PWO fra Kosttest.no`}
                        loading="lazy"
                        decoding="async"
                        width="60"
                        height="60"
                      />
                    </div>
                  )}
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
