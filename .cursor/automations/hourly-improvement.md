# Kosttest – timevis forbedring

Automatisert vedlikehold av kosttest.no. Kjører hver time og sender små forbedringer som PR.

## Oppsett i Cursor Automations

1. Åpne **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – timevis forbedring
3. **Trigger:** On a schedule → Every hour (`0 * * * *`)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På (anbefalt — agenten husker tidligere kjøringer)
7. **Prompt** — lim inn:

```
Følg skill $kosttest-hourly-improvement
```

Alternativt, hvis skill ikke resolves:

```
Les og følg instruksjonene i .cursor/skills/kosttest-hourly-improvement/SKILL.md
```

8. **Run now** for å teste én gang før du aktiverer timeplanen.

## Anbefalt start

Begynn med hver 6. time (`0 */6 * * *`) de første dagene. Skru opp til hver time når kvaliteten er god.
