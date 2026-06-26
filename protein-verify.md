# Protein verifisering — logg

Automatisert kø: `node scripts/protein-verify-queue.mjs status`

## Siste kjøring

| Felt | Verdi |
|------|-------|
| **Dato** | 2026-06-26 |
| **Verifisert** | `dymatize-iso100` — Dymatize ISO100 Hydrolyzed Whey Isolate |
| **Kilde** | [Gymgrossisten 932 g](https://www.gymgrossisten.no/iso-100-myseproteinisolat-932-g/9922-098R.html) |
| **Rapport** | `data/protein-verifications/dymatize-iso100.json` |
| **Bilde** | `public/images/protein/dymatize-iso100.jpg` |

### Viktige funn (dymatize-iso100)

- Pris 899 kr, pakke 932 g, 25 g protein per 32 g porsjon (~78 %/100 g)
- Laktose skilt ut ifølge produsent — praktisk laktosefattig, men inneholder melkeallergen
- Allergener: melk + soya (lecitin)
- Leucin ikke på norsk etikett

---

## Neste produkt (neste cron-kjøring)

```
productId: optimum-gold-standard
```

**Navn:** Optimum Nutrition Gold Standard 100% Whey  
**Forventet merchant:** Gymgrossisten  
**URL i repo:** `https://www.gymgrossisten.no/optimum-nutrition-gold-standard-whey` — verifiser at denne laster

Start med: `node scripts/protein-verify-queue.mjs start`

---

## Fullført

| ID | Dato | Status |
|----|------|--------|
| `bodylab-whey-100` | 2026-06-26 | ✅ Verifisert |
| `dymatize-iso100` | 2026-06-26 | ✅ Verifisert |

## Gjenstår (pending)

`optimum-gold-standard`, `star-whey-100`, `myprotein-impact-whey`, `scitec-100-whey-professional`, `applied-critical-whey`, `mutant-iso-surge`, `rule1-r1-protein`, `muscletech-nitrotech`, `kevin-levrone-levro-whey`, `ghost-whey`, `esn-designer-whey`, `biotech-iso-whey-zero`, `weider-premium-whey`, `proteinfabrikken-whey`, `smartsupps-whey`, `bsn-syntha6-isolate`, `olimp-pure-whey`, `qnt-delicious-whey`, `esn-isoclear`, `optimum-gold-standard-casein`, `myprotein-soy-isolate`, `myprotein-vegan-blend`, `proteinseries-100-whey`, `bulk-pure-whey`
