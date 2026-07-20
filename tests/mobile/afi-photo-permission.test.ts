import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { photoPermissionCopy } from '../../apps/mobile/src/features/nutrition/afiPhotoPermission'

const afiPhotoSource = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/afiPhoto.ts', import.meta.url),
  'utf8',
)
const sheetSource = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/AfiPhotoSheet.tsx', import.meta.url),
  'utf8',
)
const customFoodSheetSource = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/CustomFoodSheet.tsx', import.meta.url),
  'utf8',
)

describe('Afi photo permissions', () => {
  it('offers another system prompt after a first denial', () => {
    expect(photoPermissionCopy('camera', true)).toEqual({
      message: 'Kamera izni olmadan bu fotoğrafı kullanamıyorum. Hazır olduğunda tekrar deneyebilirsin.',
      actionLabel: 'Tekrar Dene',
    })
  })

  it('directs a permanent denial to device settings', () => {
    expect(photoPermissionCopy('library', false)).toEqual({
      message: 'Galeri erişimi cihaz ayarlarında kapalı görünüyor. İstersen Ayarlar’dan açıp buraya dönebilirsin.',
      actionLabel: 'Ayarları Aç',
    })
  })

  it('returns permission metadata from both picker entry points', () => {
    expect(afiPhotoSource).toContain('requestCameraPermissionsAsync()')
    expect(afiPhotoSource).toContain('requestMediaLibraryPermissionsAsync()')
    expect(afiPhotoSource).toContain('canAskAgain: perm.canAskAgain')
    expect(afiPhotoSource).toContain("kind: 'cancelled'")
  })

  it('shows retry or settings actions without treating cancellation as an error', () => {
    expect(sheetSource).toContain("result.kind === 'cancelled'")
    expect(sheetSource).toContain('permissionIssue.canAskAgain')
    expect(sheetSource).toContain('Linking.openSettings()')
    expect(sheetSource).toContain('onPress={resolvePermissionIssue}')
    expect(customFoodSheetSource).toContain('handlePhotoPick(await pickFromCamera())')
    expect(customFoodSheetSource).toContain('handlePhotoPick(await pickFromLibrary())')
    expect(customFoodSheetSource).toContain('Linking.openSettings()')
  })
})
