# Poma Academy Football V1 — Oyun Akışı

```text
MATCH_INTRO
  -> POSSESSION_POMA
      -> PASS_SUCCESS
          -> GIVE_AND_GO_SUCCESS
              -> SHOT_PREPARE
                  -> GOAL_SCORED -> GOAL_CELEBRATION
                  -> SHOT_MISSED_POST
      -> PASS_FAILED
          -> OPPONENT_ATTACK
              -> DEFENCE_SUCCESS -> POSSESSION_POMA
              -> DEFENCE_FAILED / OPPONENT_SHOT_PREPARE
                  -> SAVE_SUCCESS -> POSSESSION_POMA
                  -> GOAL_CONCEDED -> MATCH_INTRO veya yeni tur
```

## Tasarım kararı

`defence-failed.png` ile `opponent-shot-prepare.png` aynı görselin iki farklı oyun rolüdür. Savunma sorusu yanlış olduğunda kısa sonuç olarak gösterilir; ardından kale/kurtarış sorusunun bekleme ekranı olur.
