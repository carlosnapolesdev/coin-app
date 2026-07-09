interface LightboxImageLike {
  id: number
}

/**
 * Devuelve el índice que debe usar el lightbox para mostrar el adjunto `id`.
 *
 * Importante: el lightbox recibe una lista YA FILTRADA a imágenes (los PDFs no entran),
 * por lo que `findIndex` debe correr sobre esa lista filtrada, NO sobre la lista
 * completa de adjuntos. Si hay un PDF antes del adjunto clickeado, usar la lista
 * completa abriría la imagen siguiente.
 */
export function lightboxIndexFor<T extends LightboxImageLike>(
  images: readonly T[],
  id: number,
): number {
  return images.findIndex((img) => img.id === id)
}
