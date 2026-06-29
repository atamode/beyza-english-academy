# Poma Academy Football V1 — Hazır Asset Paketi

Bu paket Beyza English Academy içindeki kelime odaklı futbol mini oyunu için hazırlanmıştır.

## Klasörler

- `00-references`: stadyum, Sporty Poma ve kadro referansları
- `01-game-states`: soru bekleme / oyun durumu görselleri
- `02-results`: doğru-yanlış sonuç görselleri
- `03-videos`: dört temel sonuç videosu

## Entegrasyon

Kod tarafı yolları doğrudan `asset-manifest.json` üzerinden okumalıdır. Video bulunan olaylarda MP4 oynatılır; oynatılamazsa manifestteki `fallback` PNG gösterilir.

## Ana akış

`MATCH_INTRO → POSSESSION_POMA → PASS_SUCCESS/PASS_FAILED → hücum veya savunma dalları → GOAL_SCORED / SHOT_MISSED_POST / SAVE_SUCCESS / GOAL_CONCEDED`
