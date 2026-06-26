# Protein verify — hurtigreferanse

> **Les `data/protein-verification-status.md` først** — seksjon 1 og 1b øverst.
> **Regel:** Ingen ekte bilde = ikke ferdig. Sjekk https://kosttest.no/tester/protein/

## 🚫 IKKE test disse (har bilde = ferdig)

- `dymatize-iso100` — 2026-06-26
- `optimum-gold-standard` — 2026-06-26
- `bodylab-whey-100` — 2026-06-26
- `star-whey-100` — 2026-06-26

## ➡️ Neste produkt (mangler bilde)

| Felt | Verdi |
|------|-------|
| productId | `myprotein-impact-whey` |
| merke | MyProtein |
| navn | Impact Whey Protein |
| grunn | Neste i køen uten ekte produktbilde |

Kjør `node scripts/protein-verify-queue.mjs audit` for oppdatert liste.
