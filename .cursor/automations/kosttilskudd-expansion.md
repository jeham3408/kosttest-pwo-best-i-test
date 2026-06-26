# Kosttest – kosttilskudd faktasjekk og utvidelse

Automatisert faktasjekk som roterer mellom kosttilskudd-kategorier. Én ekte produktsjekk per kjøring.

## Oppsett i Cursor Automations

1. **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – kosttilskudd faktasjekk
3. **Trigger:** On a schedule → Every hour (`0 * * * *`)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På
7. **Prompt:**

```
Følg skill $kosttilskudd-faktasjekk

Les data/kosttilskudd-verification-status.md før du gjør noe.

Kjør:
  node scripts/kosttilskudd-verify-queue.mjs audit
  node scripts/kosttilskudd-verify-queue.mjs start

Verifiser NØYAKTIG ÉTT produkt (kun productId fra kategori-statusfil under ➡️ NÅ).
Last ned produktbilde før complete.
ALDRI test produkter som allerede har bilde.
```

8. **Run now** én gang for å teste.

## Kategorier

| Kategori | Rute | Produkter |
|----------|------|-----------|
| Kreatin (pulver + gummies) | `/tester/kreatin/` | 8 stk |
| Proteinpulver | `/tester/protein/` | 26 stk |

Køen roterer: kreatin → protein → kreatin → …

## Manuell status

```bash
node scripts/kosttilskudd-verify-queue.mjs audit
node scripts/kosttilskudd-verify-queue.mjs status
node scripts/kosttilskudd-verify-queue.mjs start
```

## Ferdig-signal

Produkt er ferdig når ekte bilde finnes i `public/images/<kategori>/<id>.jpg` og `image` i produktfilen peker dit.
