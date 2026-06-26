# Kosttilskudd faktasjekk — master status

> Les kategori-spesifikk status-MD for detaljer. Én produkt per automasjonskjøring.

## Aktiv rotasjon

### Kreatin (pulver + gummies) (`creatine`)

| Verifisert | Gjenstår | Neste | Status-MD |
|------------|----------|-------|-----------|
| 1/8 | 7 | `star-creatine-300` | [`data/creatine-verification-status.md`](data/creatine-verification-status.md) |

### Proteinpulver (`protein`)

| Verifisert | Gjenstår | Neste | Status-MD |
|------------|----------|-------|-----------|
| 3/26 | 23 | `star-whey-100` | [`data/protein-verification-status.md`](data/protein-verification-status.md) |

## Kommandoer

```bash
node scripts/kosttilskudd-verify-queue.mjs start          # auto-velg kategori med pending
node scripts/kosttilskudd-verify-queue.mjs start --category creatine
node scripts/kosttilskudd-verify-queue.mjs complete --id <id> --category creatine
node scripts/kosttilskudd-verify-queue.mjs sync-master
```

Siste master-kjøring: 2026-06-26 17:04
