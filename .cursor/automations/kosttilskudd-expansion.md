# Kosttilskudd – faktasjekk og utvidelse

Automatisert faktasjekk og utvidelse av kosttest.no til flere kosttilskudd-tester (kreatin, proteinpulver, kreatin gummies m.fl.) med samme åpne metode som PWO.

## Oppsett i Cursor Automations

1. Åpne **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttilskudd – faktasjekk og utvidelse
3. **Trigger:** On a schedule → Every hour (`0 * * * *`) eller hver 6. time (`0 */6 * * *`)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På (anbefalt)
7. **Prompt:**

```
Følg skill $kosttilskudd-faktasjekk
```

Alternativt:

```
Les og følg instruksjonene i .cursor/skills/kosttilskudd-faktasjekk/SKILL.md
```

8. **Run now** for å teste én gang.

## Hva automasjonen gjør

- Faktasjekker priser og doser mot norske butikker
- Legger til nye produkter i eksisterende tester
- Kan opprette nye testkategorier (omega-3, vitamin D, m.fl.)
- Oppdaterer SEO, sitemap og JSON-LD automatisk ved build

## Eksisterende tester

| Test | URL | Produkter |
|------|-----|-----------|
| PWO | `/tester/pwo/` | Se `pwoProducts.ts` |
| Kreatin | `/tester/kreatin/` | Se `creatineProducts.ts` |
| Proteinpulver | `/tester/proteinpulver/` | Se `proteinProducts.ts` |
| Kreatin gummies | `/tester/kreatin-gummies/` | Se `creatineGummiesProducts.ts` |

## Anbefalt start

Begynn med hver 6. time de første dagene. Skru opp til hver time når kvaliteten er god.
