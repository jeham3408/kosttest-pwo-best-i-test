import type { ProductTrustSnapshot } from '../../data/trust/types'
import ProductDataStatus from './ProductDataStatus'

/** Synlig datatillit og sist kontrollert — brukes på produktsider og i hero. */
export default function ProductTrustStrip({ snapshot }: { snapshot: ProductTrustSnapshot }) {
  return (
    <div className="product-trust-strip">
      <ProductDataStatus snapshot={snapshot} compact={false} />
    </div>
  )
}
