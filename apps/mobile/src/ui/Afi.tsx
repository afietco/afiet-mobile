import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg'

/**
 * Afi — buharı tüten mutlu kase, markanın maskotu (BRAND.md > Logo).
 * Geometri tek gerçek kaynak apps/web/public/icon.svg'den birebir port;
 * renkler ve buhar telleri marka kuralı gereği DEĞİŞTİRİLMEZ.
 */
export function Afi({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="afiBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#10b981" />
          <Stop offset="1" stopColor="#047857" />
        </LinearGradient>
      </Defs>
      <Rect width="512" height="512" rx="116" fill="url(#afiBg)" />
      <G transform="translate(256 288) scale(1.07) translate(-256 -288)">
        <Path
          d="M207 232c0-19 17-23 17-42s-17-21-17-40"
          stroke="#a7f3d0"
          strokeWidth={21}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M300 238c0-21 19-25 19-48s-19-23-19-46"
          stroke="#ffffff"
          strokeWidth={23}
          strokeLinecap="round"
          fill="none"
        />
        <Path d="M116 276h280a140 108 0 0 1-280 0z" fill="#ffffff" />
        <Path d="M180 316q23-21 46 0" stroke="#047857" strokeWidth={15} strokeLinecap="round" fill="none" />
        <Path d="M286 316q23-21 46 0" stroke="#047857" strokeWidth={15} strokeLinecap="round" fill="none" />
        <Path d="M238 342q18 14 36 0" stroke="#047857" strokeWidth={13} strokeLinecap="round" fill="none" />
        <Rect x="210" y="394" width="92" height="20" rx="10" fill="#ffffff" />
      </G>
    </Svg>
  )
}
