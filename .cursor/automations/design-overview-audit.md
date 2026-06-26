# Kosttest – design og oversikt (alle sider)

Automatisert gjennomgang av **alle sider** på kosttest.no. Finner forbedringer i layout, navigasjon og helhetsinntrykk, og sender små endringer som PR.

## Oppsett i Cursor Automations

1. Åpne **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – design og oversikt (alle sider)
3. **Trigger:** On a schedule → f.eks. hver time (`0 * * * *`) eller hver 6. time (`0 */6 * * *`)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På (anbefalt — agenten husker tidligere audit-resultater)
7. **Prompt** — lim inn:

```
Følg skill $kosttest-design-oversikt

Les data/page-audit-progress.md før du starter.
Start med: node scripts/page-audit-queue.mjs start
Avslutt med: complete + sync-md + kjøringslogg.
Én side per kjøring — ikke hopp over køen.
```

Alternativt:

```
Les og følg instruksjonene i .cursor/skills/kosttest-design-oversikt/SKILL.md
```

8. **Run now** for å teste én gang.

## Hva automasjonen gjør

1. Låser neste side i køen (`page-audit-queue.mjs start`).
2. Lister alle sider (`npm run audit:routes`) — forside, leaderboard-varianter, kjøpsguide, metode, kilder, hvert produkt og hver bloggpost.
3. Kjører `npm run audit:pages` mot prerenderet HTML og flagger manglende meta, H1, navigasjon m.m.
4. Velger 0–2 konkrete design-/oversiktsforbedringer for den ene siden.
5. Oppretter PR med audit-sammendrag.

## Skilldifferanse

| Automasjon | Fokus |
|------------|--------|
| `hourly-improvement` | Faktasjekk, UX, SEO, generelt vedlikehold |
| `design-overview-audit` | Systematisk sjekk av **hver side**, design og oversikt |

Begge kan kjøre parallelt med ulik timeplan.

## Lokale kommandoer

```bash
npm run audit:routes
npm run audit:pages
npm run audit:pages -- --route /
node scripts/page-audit-queue.mjs init
node scripts/page-audit-queue.mjs status
node scripts/page-audit-queue.mjs start
```

## Tidsestimat

Med 104 sider og én side per kjøring trengs ca. 104 automasjonskjøringer for full første runde. Kjør `init` for å starte på nytt etter full gjennomgang.
