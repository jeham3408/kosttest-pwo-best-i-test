---
name: kosttest-design-oversikt
description: Systematisk design- og oversiktsgjennomgang av alle sider på kosttest.no. Sjekker layout, lesbarhet, navigasjon og tilgjengelighet side for side. Bruk i Cursor Automations med timeplan.
---

# Kosttest – design og oversikt (alle sider)

Du er design- og UX-reviewer for kosttest.no. Målet er å systematisk gå gjennom **hver eneste side** og finne små, konkrete forbedringer i design og oversikt.

## Mål

1. Dekke alle 71 sider over tid (se `node scripts/list-routes.mjs`)
2. Implementer 1–3 konkrete forbedringer per kjøring når funn har verdi
3. Hvis ingenting trenger endring: avslutt uten PR og logg hvilke sider som ble sjekket

## Sidekart

Kjør for å se alle sider gruppert:

```bash
node scripts/list-routes.mjs
```

Grupper:
- **Forside** (`/`)
- **Leaderboard** (`/tester/pwo/*`) — 7 varianter
- **Produktsider** (`/pwo/*`) — ~45 produkter
- **Blogg** (`/blogg`, `/blogg/*`) — 15 artikler
- **Info** (`/om-metoden`, `/kilder`, kjøpsguide)

## Arbeidsflyt per kjøring

### 1. Forberedelse

```bash
npm install
npm run build
node scripts/page-audit.mjs          # statisk audit av alle sider
node scripts/page-audit.mjs --json     # maskinlesbar rapport
node scripts/list-routes.mjs --json  # sidekart
```

Les **automation memory** (`page-audit-progress.md`) for å se hvilke sider som allerede er manuelt gjennomgått.

### 2. Velg sider denne runden

Roter systematisk — ikke hopp tilfeldig:

| Prioritet | Gruppe | Antall per runde |
|-----------|--------|------------------|
| 1 | Sider med audit-funn (`page-audit.mjs`) | Alle med feil/advarsler |
| 2 | Forside + leaderboard + info | 2–3 sider |
| 3 | Produktsider | 5 sider (alfabetisk rotasjon) |
| 4 | Blogg | 2–3 artikler |

Bruk `page-audit-progress.md` i memory for å holde styr på rotasjonen. Marker sider som `✓ gjennomgått YYYY-MM-DD` etter visuell inspeksjon.

### 3. Sjekkliste per side (design og oversikt)

For hver valgte side, inspiser live på https://kosttest.no{route}/ og i kode:

**Layout og oversikt**
- [ ] Tydelig hierarki: én h1, logisk h2/h3-struktur
- [ ] Lesbar tekst: linjehøyde, kontrast, ikke for smalt/bredt på mobil
- [ ] Konsistent seksjonsstruktur med resten av siden
- [ ] Tydelig «tilbake»-navigasjon der det forventes
- [ ] Interne lenker til relevante produkter/blogg/metode

**Navigasjon**
- [ ] Header-nav fungerer og viser aktiv side
- [ ] Footer/bunnlenker der det gir mening
- [ ] Breadcrumbs eller kontekst der brukeren kan «gå seg vill»

**Mobil (375px og 768px)**
- [ ] Ingen horisontal scroll
- [ ] Klikkbare elementer minst 44px
- [ ] Tabeller/kort fungerer på små skjermer

**Tilgjengelighet**
- [ ] Bilder har meningsfulle alt-tekster
- [ ] Interaktive elementer har synlig fokus
- [ ] Farge alene bærer ikke kritisk informasjon (karakterer har også bokstav)

**Oversikt / scanbarhet**
- [ ] Viktig info over folden
- [ ] Ikke for tett tekstblokk uten luft
- [ ] Tomme eller rare tilstander håndtert (f.eks. produkt finnes ikke)

### 4. Implementer forbedringer

- Små, målbare endringer — følg stil i `src/App.tsx`, `src/App.css` og `src/components/`
- Ikke store visuelle omskrivninger
- All brukertekst på norsk, ærlig og nøktern tone
- Ikke endre produktdata, karakterer eller faktapåstander (det er en annen automasjon)

### 5. Verifiser og lever

```bash
npm run lint
npm run build
node scripts/page-audit.mjs
```

- Maks én PR per kjøring
- Oppdater `page-audit-progress.md` i memory
- PR-beskrivelse på norsk: hvilke sider som ble sjekket, hva som ble endret, hva som ble sett uten endring

## Regler

- Ikke endre `.env`, hemmeligheter eller deploy-konfig
- Ikke push til `main` — bruk PR
- Ikke aktiver AI-scan uten `OPENAI_API_KEY`
- Prioriter brukerverdi: lesbarhet og oversikt over pynt

## Nøkkelfiler

| Fil | Formål |
|-----|--------|
| `scripts/list-routes.mjs` | Alle sider gruppert |
| `scripts/page-audit.mjs` | Statisk audit etter build |
| `src/routing.ts` | Ruter og meta |
| `src/App.tsx` | Sider og layout |
| `src/App.css` | Stil |
| `src/components/` | Gjenbrukbare komponenter |

Live: https://kosttest.no
