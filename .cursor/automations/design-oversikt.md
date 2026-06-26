# Kosttest – design og oversikt (alle sider)

Automatisert design- og UX-gjennomgang som systematisk sjekker hver side på kosttest.no.

## Oppsett i Cursor Automations

1. Åpne **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – design og oversikt
3. **Trigger:** On a schedule → Every hour (`0 * * * *`) eller hver 6. time (`0 */6 * * *`)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På (påkrevd — agenten husker hvilke sider som er gjennomgått)
7. **Prompt** — lim inn:

```
Følg skill $kosttest-design-oversikt
```

Alternativt:

```
Les og følg instruksjonene i .cursor/skills/kosttest-design-oversikt/SKILL.md
```

8. **Run now** for å teste én gang.

## Forskjell fra timevis forbedring

| | Timevis forbedring | Design og oversikt |
|---|---|---|
| Fokus | Faktasjekk → UX → SEO | Design, layout, oversikt |
| Dekning | Tilfeldig / prioritert | Alle 71 sider, rotert |
| Verktøy | Manuell inspeksjon | `page-audit.mjs` + visuell sjekk |
| Memory | Generell | `page-audit-progress.md` med side-status |

## Verktøy i repo

```bash
node scripts/list-routes.mjs       # alle sider gruppert
node scripts/page-audit.mjs        # statisk audit (krever build)
npm run build && node scripts/page-audit.mjs --json
```

## Anbefalt start

Kjør hver 6. time de første dagene. Skru opp til hver time når rotasjonen fungerer og PR-kvaliteten er god.
