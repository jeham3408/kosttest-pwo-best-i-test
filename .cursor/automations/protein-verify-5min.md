# Kosttest – protein verifisering (hvert 5. min)

Én ekte produktsjekk per kjøring. Unngår at agenten blir lat og faker hele listen på én gang.

## Oppsett i Cursor Automations

1. **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – protein verifisering (1 produkt)
3. **Trigger:** On a schedule → Custom cron → `*/5 * * * *` (hvert 5. minutt)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På
7. **Prompt:**

```
Følg skill $kosttest-protein-verify

Du skal verifisere NØYAKTIG ÉTT proteinpulver denne kjøringen.
Start med: node scripts/protein-verify-queue.mjs start
Ikke gå videre til neste produkt i køen.
```

8. **Run now** én gang for å teste.

## Tidsestimat

26 produkter × 5 min ≈ **2 timer 10 min** for full første gjennomgang. Deretter kan du senke frekvens eller kjøre kun `pending`.

## Manuell status

```bash
node scripts/protein-verify-queue.mjs status
node scripts/protein-verify-queue.mjs next
```

## Viktig

- Agenten **må** avvise/fjerne produkter som ikke finnes (som NutriTac/Peveo protein).
- Hver kjøring = **maks 1 commit** med ett produkt.
