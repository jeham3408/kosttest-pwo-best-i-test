import proteinImagesJson from '../../data/protein-images.json'

export const proteinImages: Record<string, string> = proteinImagesJson

export function proteinImageFor(id: string): string | undefined {
  return proteinImages[id]
}
