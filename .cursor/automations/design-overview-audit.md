# Kosttest – design og oversikt (alle sider)

Systematisk gjennomgang av hver side på kosttest.no — én side per kjøring med auto-sjekk og valgfri UX-forbedring.

## Oppsett i Cursor Automations

1. **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – design og oversikt
3. **Trigger:** On a schedule → Every hour (`0 * * * *`)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På (anbefalt)
7. **Prompt** — lim inn:

```
Følg skill $kosttest-design-oversikt

STEG 0: Les data/page-audit-progress.md

Kjør:
  node scripts/page-audit-queue.mjs init
  node scripts/page-audit-queue.mjs audit
  node scripts/page-audit-queue.mjs start

Ta screenshot av siden som returneres (url-feltet).
Gjennomgå design, oversikt og navigasjon for NØYAKTIG ÉN side.
Implementer maks én liten forbedring hvis tydelig nødvendig — ellers complete uten PR.

Ved kodeendring: npm run lint && npm run build, deretter PR.
Fullfør alltid:
  node scripts/page-audit-queue.mjs complete --route "<route>" --notes "<kort>" [--fixed true]
```

Alternativt uten skill-resolve:

```
Les og følg .cursor/skills/kosttest-design-oversikt/SKILL.md
```

8. **Run now** for å teste én gang.

## Manuell status

```bash
node scripts/list-routes.mjs
node scripts/audit-pages.mjs --route /
node scripts/page-audit-queue.mjs status
node scripts/page-audit-queue.mjs next
```

## Forskjell fra timevis forbedring

| Automasjon | Fokus |
|------------|-------|
| `hourly-improvement` | Faktasjekk, tilfeldige småforbedringer |
| `design-overview-audit` | **Alle sider** — systematisk design/UX-kø |

Kjør gjerne design-audit hver time og timevis forbedring hver 6. time for å unngå overlapp.
