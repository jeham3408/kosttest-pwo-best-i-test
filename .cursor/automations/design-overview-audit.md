# Kosttest – design og oversikt (side-audit)

Systematisk gjennomgang av **alle sider** på kosttest.no. Én side per kjøring, med statisk audit og små UX-forbedringer som PR.

## Oppsett i Cursor Automations

1. **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – design og oversikt
3. **Trigger:** On a schedule → Every hour (`0 * * * *`)

   Alternativ for raskere første runde: `0 */2 * * *` (hver 2. time).

4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På (anbefalt)
7. **Prompt:**

```
Følg skill $kosttest-design-oversikt

Les data/page-audit-progress.md.
Start med: node scripts/page-audit-queue.mjs start
Gå gjennom NØYAKTIG ÉN side fra køen.
Kjør npm run build && npm run audit:pages for den siden.
Avslutt med complete + sync-md.
Maks én PR per kjøring med små design/oversikt-forbedringer.
```

8. **Run now** én gang for å teste.

## Tidsestimat

104 sider × 1 time ≈ **4,3 dager** for full første runde. Deretter kan frekvensen senkes til f.eks. daglig eller ukentlig `init` for ny runde.

## Manuell status

```bash
node scripts/page-audit-queue.mjs status
node scripts/page-audit-queue.mjs next
npm run audit:pages
npm run audit:routes
```

## Forskjell fra timevis forbedring

| Automasjon | Fokus |
|------------|-------|
| `hourly-improvement` | Faktasjekk, generelle småforbedringer |
| `design-overview-audit` | Systematisk **alle sider**, design/UX/oversikt |
| `protein-verify-5min` | Én proteinproduktverifisering per kjøring |

Kjør gjerne alle tre parallelt — de overlapper ikke i ansvar.
