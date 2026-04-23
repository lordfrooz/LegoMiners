# Leaderboard Modal Tasarımı

Tarih: 2026-04-23
Durum: Onaylandı

## Genel Bakış

Landing page'de nav'daki "Leaderboard" linkine tıklayınca açılan overlay modal. Sadece tasarım — oyun bağlantısı yok.

## Tasarım Detayları

### Modal Yapısı
- Landing page üzerinde tam ekran overlay (arka plan blur + karartma)
- Merkezi panel: max-width ~600px, padding 24px
- Üstte "LEADERBOARD" başlığı + sağ üstte kapatma butonu (X)

### Panel Stili
- `backdrop-filter: blur(12px)`
- Background: `linear-gradient(180deg, rgba(10, 11, 18, 0.85) 0%, rgba(9, 10, 18, 0.75) 100%)`
- Border: 1px solid neon glow (violet — `#8f5dff`, opacity 0.4)
- Box-shadow: neon glow efekti
- Border-radius: 20px

### Liste Yapısı
- 10 satır (top 10 oyuncu)
- Her satırda: sıra numarası | cüzdan adresi | gelir

### Satır Detayları
- Hover'da: hafif arka plan parlaklığı + glow efekti
- Sıra 1-3: Özel renk vurgusu (altın, gümüş, bronz)
  - 1: Gold gradient text
  - 2: Silver gradient text  
  - 3: Bronze gradient text
- Cüzdan adresi: Kısaltılmış `0x1234...abcd` formatı
- Gelir: `$X.XX/min` formatı

### Kapatma
- Sağ üstte X butonu (circle, hover efekti)
- Overlay dışına tıklayınca kapanır
- ESC tuşu ile kapanır

## Responsive
- Mobile'da panel tam ekran alır
- Breakpoint: 560px

## Teknoloji
- React component (client component)
- CSS Modules
- Aynı tasarım dili: tempo-landing-page.module.css'deki stiller referans alınır
