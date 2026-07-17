import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Skeleton } from './Skeleton'

/**
 * Tam sayfa yükleme iskeleti — HER EKRANDA AYNI. Bir ekranın verisi/component'leri
 * gelene dek onun yerine geçer; boş/atlamalı açılış yerine sakin bir bekleme.
 * Veri hazır olunca ekran gerçek içeriğini render eder. Genel amaçlı bir başlık
 * satırı + birkaç kart bloğu; her sayfa düzenine yeterince uyar.
 */
export function PageSkeleton() {
  const insets = useSafeAreaInsets()
  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        scrollEnabled={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        {/* Başlık satırı: ikon + başlık/alt başlık */}
        <View className="mb-6 flex-row items-center gap-3">
          <Skeleton width={40} height={40} radius={12} />
          <View className="gap-2">
            <Skeleton width={160} height={18} />
            <Skeleton width={104} height={12} />
          </View>
        </View>

        {/* İçerik blokları */}
        <View className="gap-3">
          <Skeleton height={128} radius={16} />
          <Skeleton height={92} radius={16} />
          <Skeleton height={140} radius={16} />
          <Skeleton height={96} radius={16} />
        </View>
      </ScrollView>
    </View>
  )
}
