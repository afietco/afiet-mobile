import { View } from 'react-native'
import { AppText } from './AppText'

/** "afiet" yazı-logosu + tagline; Bugün sayfasının KALICI başlığı.
    Kullanıcı kararı (10 Tem 2026): yazı-logo bu stildir (küçük harf,
    Nunito ExtraBold, marka yeşili) ve Bugün'den hiç kalkmaz.
    Faz 6'da gerçek Bugün ekranı gelirken bu bileşen aynen kullanılır. */
export function BrandHeader() {
  return (
    <View>
      <AppText weight="extrabold" className="text-4xl text-emerald-600">
        afiet
      </AppText>
      <AppText className="mt-1 text-soft">Sayma, dengele.</AppText>
    </View>
  )
}
