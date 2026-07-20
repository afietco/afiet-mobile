export const AFI_PHOTO_MAX_EDGE = 1280
export const AFI_PHOTO_COMPRESSION = 0.65

export interface ImageResize {
  width?: number
  height?: number
}

/** Constrains only the long edge and lets ImageManipulator preserve aspect ratio. */
export function afiPhotoResize(width: number, height: number): ImageResize | null {
  if (width <= 0 || height <= 0 || Math.max(width, height) <= AFI_PHOTO_MAX_EDGE) return null
  return width >= height ? { width: AFI_PHOTO_MAX_EDGE } : { height: AFI_PHOTO_MAX_EDGE }
}
