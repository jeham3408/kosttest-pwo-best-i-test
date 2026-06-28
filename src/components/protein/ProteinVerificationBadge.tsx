import { getProteinVerificationExplanation, getProteinVerificationStatus } from '../../data/proteinVerification'

export default function ProteinVerificationBadge({ productId }: { productId: string }) {
  const status = getProteinVerificationStatus(productId)
  if (status !== 'verified') return null

  const explanation = getProteinVerificationExplanation(productId)

  return (
    <span
      className="protein-verification-badge"
      title={explanation}
      aria-label={explanation}
    >
      Kontrollert
    </span>
  )
}
