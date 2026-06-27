import creatineImagesJson from '../../data/creatine-images.json'

export const creatineImages: Record<string, string> = creatineImagesJson

export function creatineImageFor(id: string): string | undefined {
  return creatineImages[id]
}
