import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AFI_PHOTO_COMPRESSION,
  AFI_PHOTO_MAX_EDGE,
  afiPhotoResize,
} from '../../apps/mobile/src/features/nutrition/afiPhotoImage'

const afiPhotoSource = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/afiPhoto.ts', import.meta.url),
  'utf8',
)

describe('Afi photo upload preparation', () => {
  it('limits the long edge while preserving the aspect ratio dimension', () => {
    expect(afiPhotoResize(4032, 3024)).toEqual({ width: AFI_PHOTO_MAX_EDGE })
    expect(afiPhotoResize(3024, 4032)).toEqual({ height: AFI_PHOTO_MAX_EDGE })
  })

  it('does not upscale small or invalid images', () => {
    expect(afiPhotoResize(1024, 768)).toBeNull()
    expect(afiPhotoResize(0, 0)).toBeNull()
  })

  it('renders a resized compressed JPEG before requesting base64', () => {
    expect(AFI_PHOTO_COMPRESSION).toBeLessThan(1)
    expect(afiPhotoSource).toContain('ImageManipulator.manipulate(asset.uri)')
    expect(afiPhotoSource).toContain('context.resize(resize)')
    expect(afiPhotoSource).toContain('rendered.saveAsync({')
    expect(afiPhotoSource).toContain('format: SaveFormat.JPEG')
    expect(afiPhotoSource).not.toContain('const PICK_OPTS')
  })
})
