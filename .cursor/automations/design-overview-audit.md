# Kosttest – design- og oversiktsaudit

Automatisert gjennomgang av **alle sider** på kosttest.no. Finner forbedringer i layout, navigasjon og helhetsinntrykk, og sender små endringer som PR.

## Oppsett i Cursor Automations

1. Åpne **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – design og oversikt (alle sider)
3. **Trigger:** On a schedule → f.eks. hver 6. time (`0 */6 * * *`) eller daglig (`0 8 * * *`)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På (anbefalt — agenten husker tidligere audit-resultater)
7. **Prompt** — lim inn:

```
Følg skill $kosttest-design-audit
```

Alternativt:

```
Les og følg instruksjonene i .cursor/skills/kosttest-design-audit/SKILL.md
```

8. **Run now** for å teste én gang.

## Hva automasjonen gjør

1. Lister alle sider (`npm run routes:list`) — forside, leaderboard-varianter, kjøpsguide, metode, kilder, hvert produkt og hver bloggpost.
2. Kjører `npm run audit:pages` mot live site og flagger manglende meta, H1, navigasjon m.m.
3. Velger 1–3 konkrete design-/oversiktsforbedringer.
4. Oppretter PR med audit-sammendrag.

## Skilldifferanse

| Automasjon | Fokus |
|------------|--------|
| `hourly-improvement` | Faktasjekk, UX, SEO, generelt vedlikehold |
| `design-overview-audit` | Systematisk sjekk av **hver side**, design og oversikt |

Begge kan kjøre parallelt med ulik timeplan.

## Lokale kommandoer

```bash
npm run routes:list
npm run audit:pages
npm run audit:pages -- --json
npm run audit:pages -- --only=produkt
```
