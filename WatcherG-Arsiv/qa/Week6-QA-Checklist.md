# Week 6 QA Checklist

Tarih: 2026-04-07
Kapsam: Hafta 6 haber veri katmani, event clustering, dynamic reliability, global geolocation, resmi topic feed'ler ve haber/video iliskili panel akisi

## 1. Otomatik Dogrulama

Durum: `Kod tarafinda tamam`

- `npm run lint`
  - Sonuc: Gecti
  - Not: Sadece mevcut `<img>` uyarilari var, hafta 6 kapsami ile ilgili degil
- `npm run build`
  - Sonuc: Gecti
- `npm run smoke:h6`
  - Durum: Script guncellendi
  - Dogrulanan endpoint:
    - `/api/news?debug=1`
  - Dogrulanan davranislar:
    - JSON response
    - `meta` alani
    - `debug` alani
    - `clustered` sonuc yapisi
    - cache hit davranisi
    - cluster preview ve count tutarliligi
    - `healthOfficial`, `topicOfficial`, `technologyOfficial`, `scienceOfficial` source sayaci

## 2. Backend / Veri Checklist

Durum: `Kod tarafinda tamam`

- [x] `/api/news` response'u cluster meta tasiyor
- [x] Haber pinleri `eventMeta.type = news` ile event-level bilgi tasiyabiliyor
- [x] GDELT, Guardian, NewsData ve RSS icin dinamik reliability skoru eklendi
- [x] Cluster icinde coklu kaynak dogrulamasi skora yansiyor
- [x] Haber konumlandirmasi `countries.json` ve `cities.json` lookup ile guclendirildi
- [x] `LOCATION_HINTS` artik birincil degil, destekleyici fallback
- [x] `politics`, `economy`, `technology`, `science` icin resmi/topic feed katmani var
- [x] Detail panelde ayni event icin source switching var
- [x] Haber bazli iliskili video eslesme hattı var
- [ ] Gercek canli veri uzerinde tekrarli smoke sonucu kayda alinmali

## 3. Desktop / Laptop Checklist

Durum: `Manuel test bekliyor`

- [ ] Haber pin secimi detail paneli aciyor
- [ ] Clustered haberlerde detail panel bilgisi dogru kaliyor
- [ ] Uzun baslikli haberlerde panel tasmasi yok
- [ ] Farkli bolgelerden haberlerde konum alani makul gorunuyor
- [ ] `2D` ve `3D` modlarinda haber pin secimi tutarli
- [ ] Detail panelde ilgili video blogu yalnizca alakali videolar gosteriyor

## 4. Mobil Checklist

Durum: `Manuel test bekliyor`

- [ ] Android Chrome uzerinde haber pin secimi
- [ ] iOS Safari uzerinde haber pin secimi
- [ ] Haber detail panel ac/kapa akisi
- [ ] Uzun baslik ve uzun konum metinlerinde okunabilirlik
- [ ] Yogun haber akisinda panel + map gesture cakismasi kontrolu
- [ ] Alt panel video akisi ile haber detail paneli birlikte bozulmuyor

## 5. Hafta 6 Kapanis Kriteri

Asagidaki maddeler tamamlandiginda Hafta 6 backend kapsami buyuk olcude kapanmis sayilir:

- [x] Haberler tek endpoint uzerinden toplanir
- [x] Event clustering vardir
- [x] Dynamic reliability vardir
- [x] Global geolocation iyilestirmesi vardir
- [x] Build gecer
- [x] Smoke script mevcuttur
- [x] `politics/economy/technology/science` icin resmi kaynak katmani vardir
- [x] Source switching UI vardir
- [ ] Gercek dev server uzerinde `smoke:h6` sonucu kayda alinmis durumda
- [ ] Manuel desktop ve mobil QA tamamlandi

## 6. Acik Kalemler

Hafta 6 icin kalan ana aciklar:

- ReliefWeb news expansion halen kontrollu / opsiyonel
- Gercek dev server uzerinde tekrarli `smoke:h6` kaydi alinmali
- Manuel mobil ve desktop QA kapanisi alinmali
