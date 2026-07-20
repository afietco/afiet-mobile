export type PhotoSource = 'camera' | 'library'

export interface PhotoPermissionCopy {
  message: string
  actionLabel: string
}

/** Returns calm permission guidance tailored to whether the OS can prompt again. */
export function photoPermissionCopy(
  source: PhotoSource,
  canAskAgain: boolean,
): PhotoPermissionCopy {
  const access = source === 'camera' ? 'Kamera' : 'Galeri'
  if (canAskAgain) {
    return {
      message: `${access} izni olmadan bu fotoğrafı kullanamıyorum. Hazır olduğunda tekrar deneyebilirsin.`,
      actionLabel: 'Tekrar Dene',
    }
  }
  return {
    message: `${access} erişimi cihaz ayarlarında kapalı görünüyor. İstersen Ayarlar’dan açıp buraya dönebilirsin.`,
    actionLabel: 'Ayarları Aç',
  }
}
