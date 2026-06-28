# Kosttest.no — banner-prompts for ChatGPT (minimal pakke)

**Versjon:** 2026-06-28  
**Totalt å generere:** **15 bilder** (+ 5 eksisterende forsidebannere som referanse)

---

## Slik bruker du pakken

1. Last opp **`kosttest-banner-prompts.zip`** til ChatGPT.
2. Si:

   > Les `BANNER-PROMPTS.md` og `BANNER-MANIFEST.csv`. Generer alle 15 bilder merket NY. Desktop 1916×821, mobil 1086×1448. Bruk vedlagte logo, produkter og referansebannere. Eksporter som zip med eksakte filnavn.

3. Legg ferdige filer i `public/brand/` og oppdater `src/brand.ts`.

---

## Hvorfor bare 15?

Kategorisidene har allerede **tekst-hero** (`h1` + ingress). Banneret trenger ikke unik tekst per underside — bare per **hovedkategori** og **nisje-SEO**.

| Gjenbruk hub-banner | Undersider som deler samme bilde |
|---------------------|--------------------------------|
| PWO hub (05–06) | `/beste`, `/sterkeste`, `/billigste`, `/verdi`, `/nybegynner` |
| Protein hub (07–08) | `/beste`, `/billigste` |
| Kreatin hub (09–10) | `/beste`, `/billigste` |

**Ikke banner på:** guider (`slik-velger-du`, `/metode`), blogg, kilder, dataferskhet, enkeltprodukter, sammenlign.

---

## Tekniske spesifikasjoner

| Variant | Størrelse | Ratio |
|---------|-----------|-------|
| Desktop | **1916 × 821 px** | 2,33 : 1 |
| Mobil | **1086 × 1448 px** | 3 : 4 |

Tekst **bakt inn** i bildet. Safe zone: venstre tredjedel (desktop) / øvre halvdel (mobil).

---

## Merkevare

| Element | Hex |
|---------|-----|
| Navy | `#04172b` |
| Grønn accent | `#32c96a` |
| Overflate | `#f4f6f8` |

**Logo:** `logo-light.png` på mørk bakgrunn · ca. 120–180 px bredde desktop.

**Tone:** Deklarasjonsanalyse, åpen metode — ikke lab-test-hype, ikke spons, ikke gym-bro.

---

## Vedlagte assets

### Logo — `assets/logo/`
`logo-light.png` · `logo-dark.png` · `icon-light.png`

### Referansebannere — `assets/reference-banners/`
`home-hero-banner.png` · `home-hero-banner-mobile.png` · `home-hero-banner-charity.png` · `home-hero-banner-charity-mobile.png` · `home-hero-banner-independent-mobile.png`

### Produkter — `assets/products/`

| Fil | Brukes på |
|-----|-----------|
| `peveo-maxed.jpg` | PWO hub |
| `naturecan-pwo.jpg` | PWO hub |
| `peveo-stim-free.jpg` | PWO stim-free |
| `star-whey-100.jpg` | Protein hub |
| `myprotein-vegan-blend.jpg` | Protein vegan |
| `nutritac-bare-creatine.png` | Kreatin hub + creapure |
| `esn-ultrapure-creatine.jpg` | Kreatin hub |

Produktbilder: subtilt i høyre tredjedel — blur/low opacity.

---

## Felles stilblokk (lim inn i hver prompt)

```
Editorial Scandinavian health-tech banner for kosttest.no.
Match attached reference banners (home-hero-banner.png / mobile).
Palette: navy #04172b, green #32c96a, off-white #f4f6f8.
Trustworthy, transparent — NOT gym-bro, NOT "lab tested", NOT sponsored ads.
Kosttest logo from assets (logo-light on dark backgrounds).
Product photos: subtle blurred silhouettes on right third only.
Modern sans-serif, Norwegian baked-in text, high contrast.
Safe zone: headline + subline left third (desktop) or upper half (mobile).
```

**Negativ:** neon gym, bodybuilders, English headlines, fake #1 badges, dominant brand logos.

---

# 15 bilder å generere

---

## 05–06 · PWO hub `/tester/pwo/` (+ undersider)

**Desktop `05-pwo-hub-desktop-1916x821.png`**
```
[COMMON STYLE BLOCK]
Wide 1916x821. Formula lines + ingredient dots. Blurred peveo-maxed.jpg + naturecan-pwo.jpg right.
Logo top-left.

Eyebrow: "Deklarasjonsanalyse"
Headline: "PWO rangert etter deklarert formel"
Subline: "Åpne regler · ingen kjøpte plasseringer"
```

**Mobil `06-pwo-hub-mobile-1086x1448.png`**
```
[COMMON STYLE BLOCK]
Vertical. One blurred PWO tub (peveo-maxed ref).

Eyebrow: "Deklarasjonsanalyse"
Headline: "PWO etter etiketten"
Subline: "Formelscore · åpen metode"
```

---

## 07–08 · Protein hub `/tester/protein/` (+ undersider)

**Desktop `07-protein-hub-desktop-1916x821.png`**
```
[COMMON STYLE BLOCK]
Whey powder texture, label grid. star-whey-100.jpg blurred right.

Eyebrow: "Protein per 100 g"
Headline: "Sammenlign protein etter etiketten"
Subline: "DIAAS-estimat · pris · publiserte regler"
```

**Mobil `08-protein-hub-mobile-1086x1448.png`**
```
Headline: "Protein rangert åpent"
Subline: "Etikettdata · ingen spons"
```

---

## 09–10 · Kreatin hub `/tester/kreatin/` (+ undersider)

**Desktop `09-kreatin-hub-desktop-1916x821.png`**
```
[COMMON STYLE BLOCK]
Creatine crystals. nutritac-bare-creatine.png + esn-ultrapure-creatine.jpg blurred right.

Eyebrow: "Kreatin monohydrat"
Headline: "Finn kreatin etter deklarasjon"
Subline: "Dose · renhet · pris per gram — åpen metode"
```

**Mobil `10-kreatin-hub-mobile-1086x1448.png`**
```
Headline: "Kreatin etter etiketten"
Subline: "Sammenlign dose og pris åpent"
```

---

## 11 · Om metoden `/om-metoden/` (kun desktop)

**Desktop `11-metode-desktop-1916x821.png`**
```
[COMMON STYLE BLOCK]
Open document + checklist + magnifying glass on ingredient list. No product photos.

Eyebrow: "Slik rangerer vi"
Headline: "Åpen metode — ingen kjøpte plasseringer"
Subline: "Regler, kilder og begrensninger er publisert"
```

**Mobil:** Bruk eksisterende `home-hero-banner-independent-mobile.png` (referanse i pakken).

---

## 12–13 · Om Kosttest `/om-kosttest/`

**Desktop `12-om-kosttest-desktop-1916x821.png`**
```
[COMMON STYLE BLOCK]
Subtle Norway map outline, connected trust dots. No charity ribbon.

Eyebrow: "Om oss"
Headline: "Kosttest — uavhengig sammenligning"
Subline: "Deklarasjonsanalyse for norske forbrukere"
```

**Mobil `13-om-kosttest-mobile-1086x1448.png`**
```
Headline: "Uavhengig kosttilskudd-guide"
Subline: "Åpen data · ingen sponsede rangeringer"
```

---

## 14–15 · PWO stim-free `/tester/pwo/stim-free/`

**Desktop `14-pwo-stim-free-desktop-1916x821.png`**
```
[COMMON STYLE BLOCK]
Calm green waves — NO lightning, NO caffeine icons. peveo-stim-free.jpg ref.

Eyebrow: "0 mg koffein"
Headline: "Koffeinfri PWO etter formel"
Subline: "Stim-free rangert uten koffein i scoren"
```

**Mobil `15-pwo-stim-free-mobile-1086x1448.png`**
```
Headline: "Stim-free PWO"
Subline: "Koffeinfri · deklarasjonsanalyse"
```

---

## 16–17 · Protein vegan `/tester/protein/vegan/`

**Desktop `16-protein-vegan-desktop-1916x821.png`**
```
[COMMON STYLE BLOCK]
Plant leaf motifs + powder. myprotein-vegan-blend.jpg blurred right.

Eyebrow: "Plantebasert"
Headline: "Vegansk protein — etikett for etikett"
Subline: "Soya og erte/ris rangert etter DIAAS-estimat"
```

**Mobil `17-protein-vegan-mobile-1086x1448.png`**
```
Headline: "Vegan protein 2026"
Subline: "Plantebasert · åpen metode"
```

---

## 18–19 · Kreatin creapure `/tester/kreatin/creapure/`

**Desktop `18-kreatin-creapure-desktop-1916x821.png`**
```
[COMMON STYLE BLOCK]
Purity crystals. nutritac-bare-creatine.png ref. NO Creapure® logo.

Eyebrow: "Merket råstoff"
Headline: "Creapure og ren kreatin"
Subline: "Produkter med dokumentert merket råstoff"
```

**Mobil `19-kreatin-creapure-mobile-1086x1448.png`**
```
Headline: "Creapure kreatin"
Subline: "Renhet · deklarasjonsanalyse"
```

---

# Eksisterende (ikke regenerer)

| Fil | Bruk |
|-----|------|
| `home-hero-banner.png` / `-mobile.png` | Forside hero |
| `home-hero-banner-charity.png` / `-charity-mobile.png` | Forside veldedighet |
| `home-hero-banner-independent-mobile.png` | Om metoden mobil |

---

## Forventet output-zip

```
05-pwo-hub-desktop-1916x821.png
06-pwo-hub-mobile-1086x1448.png
07-protein-hub-desktop-1916x821.png
08-protein-hub-mobile-1086x1448.png
09-kreatin-hub-desktop-1916x821.png
10-kreatin-hub-mobile-1086x1448.png
11-metode-desktop-1916x821.png
12-om-kosttest-desktop-1916x821.png
13-om-kosttest-mobile-1086x1448.png
14-pwo-stim-free-desktop-1916x821.png
15-pwo-stim-free-mobile-1086x1448.png
16-protein-vegan-desktop-1916x821.png
17-protein-vegan-mobile-1086x1448.png
18-kreatin-creapure-desktop-1916x821.png
19-kreatin-creapure-mobile-1086x1448.png
```

---

## Sjekkliste

- [ ] 15 filer, riktige navn og oppløsninger
- [ ] Norsk tekst lesbar på mobil
- [ ] Logo + produkter subtile
- [ ] Matcher referansebannere

*Manifest: `BANNER-MANIFEST.csv`*
