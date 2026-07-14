/**
 * afiet-web reposundaki src/index.css token aynası — token eklerken/
 * değiştirirken orada da güncelle. Değişkenler src/global.css'te tanımlı.
 */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        soft: 'rgb(var(--c-soft) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Nunito_400Regular'],
      },
      // Uygulama geneli okunabilirlik: varsayılan Tailwind ölçeği ~1-2px
      // büyütüldü (kullanıcı geri bildirimi, 14 Tem 2026). text-* kullanan
      // HER metin bundan etkilenir; style ile verilen puntolar etkilenmez.
      fontSize: {
        xs: ['13px', '18px'],
        sm: ['15px', '21px'],
        base: ['17px', '25px'],
        lg: ['19px', '28px'],
        xl: ['21px', '30px'],
        '2xl': ['25px', '33px'],
        '3xl': ['31px', '38px'],
      },
    },
  },
  plugins: [],
}
