#!/usr/bin/env node
/**
 * Konverterer brukarsynlege nynorsk-strengar til bokmål i src/.
 * Kjør éin gang ved behov: node scripts/normalize-bokmal.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const root = join(process.cwd(), 'src')

/** Orden matters — lengre/frase først der det trengs */
const replacements = [
  ['Kor ferske er dataa?', 'Hvor ferske er dataene?'],
  ['kor-ferske-er-dataa', 'hvor-ferske-er-dataene'],
  ['Samanlikninga', 'Sammenligningen'],
  ['samanlikninga', 'sammenligningen'],
  ['/samanlikn/', '/sammenlign/'],
  ['Samanlikn ', 'Sammenlign '],
  ['Samanlikning', 'Sammenligning'],
  ['samanlikn', 'sammenlign'],
  ['Ikkje oppgitt per produkt', 'Ikke oppgitt per produkt'],
  ['Ikkje laboratorietesta av Kosttest', 'Ikke laboratorietestet av Kosttest'],
  ['Ikkje funne i opne kjelder', 'Ikke funnet i åpne kilder'],
  ['Ikkje dokumentert', 'Ikke dokumentert'],
  ['Ikkje relevant', 'Ikke relevant'],
  ['Ikkje rangert', 'Ikke rangert'],
  ['Ventar på kontroll', 'Venter på kontroll'],
  ['Avgrensa datatillit', 'Begrenset datatillit'],
  ['Avgrensa tillit', 'Begrenset tillit'],
  ['Høg datatillit', 'Høy datatillit'],
  ['Høg tillit', 'Høy tillit'],
  ['Kva betyr datatillit?', 'Hva betyr datatillit?'],
  ['Kva betyr', 'Hva betyr'],
  ['Korleis', 'Hvordan'],
  ['Kor mykje', 'Hvor mye'],
  ['Kvifor', 'Hvorfor'],
  ['Les meir:', 'Les mer:'],
  ['sjå datatillit', 'se datatillit'],
  ['Sjå ', 'Se '],
  ['sjå ', 'se '],
  ['ingrediensar', 'ingredienser'],
  ['Ingrediensar', 'Ingredienser'],
  ['endrar ikkje', 'endrer ikke'],
  ['Endrar ikkje', 'Endrer ikke'],
  ['endrar ', 'endrer '],
  ['Endrar ', 'Endrer '],
  ['ikkje ', 'ikke '],
  ['Ikkje ', 'Ikke '],
  ['berre ', 'bare '],
  ['Berre ', 'Bare '],
  ['høgast', 'høyest'],
  ['Høgast', 'Høyest'],
  ['høgare', 'høyere'],
  ['lågast', 'lavest'],
  ['Lågast', 'Lavest'],
  ['låg ', 'lav '],
  ['Låg ', 'Lav '],
  ['nybyrjarar', 'nybegynnere'],
  ['nybyrjar', 'nybegynner'],
  ['manglande', 'manglende'],
  ['Manglande', 'Manglende'],
  ['manglar', 'mangler'],
  ['opne kjelder', 'åpne kilder'],
  ['renheit', 'renhet'],
  ['Renheit', 'Renhet'],
  ['kaloriar', 'kalorier'],
  ['prisar', 'priser'],
  ['forhandlardata', 'forhandlerdata'],
  ['opplysningar', 'opplysninger'],
  ['Byggjer', 'Bygger'],
  ['byggjer', 'bygger'],
  ['vert ', 'blir '],
  ['Vert ', 'Blir '],
  ['eitt ', 'ett '],
  ['Eitt ', 'Ett '],
  ['fleire', 'flere'],
  ['lenkje', 'lenke'],
  ['Lenkje', 'Lenke'],
  ['Kunne ikkje', 'Kunne ikke'],
  ['meir ', 'mer '],
  ['Meir ', 'Mer '],
  ['inngår ikkje', 'inngår ikke'],
  ['plasseringa', 'plasseringen'],
  ['rangeringa', 'rangeringen'],
  ['formelscoren', 'formelscoren'],
  ['forklarande', 'forklarende'],
  ['marknadsført', 'markedsført'],
  ['marknadsføring', 'markedsføring'],
  ['søtstofffriheit', 'søtstofffrihet'],
  ['koffeinfølsomheit', 'koffeinfølsomhet'],
  ['produktdata', 'produktdata'],
  ['produkt ', 'produkt '],
  ['produkta', 'produktene'],
  ['produkt.', 'produkt.'],
  ['Innsending endrar', 'Innsending endrer'],
  ['meldingar vert', 'meldinger blir'],
  ['vurdert manuelt', 'vurdert manuelt'],
  ['Nullstill filter', 'Nullstill filter'],
  ['Ingen produkt matcher', 'Ingen produkter matcher'],
  ['Full datadekning', 'Full datadekning'],
  ['Kreatinbadgar', 'Kreatinbadger'],
  ['Proteinbadgar', 'Proteinbadger'],
  ['Badgar vert', 'Badger blir'],
  ['badgar', 'badger'],
  ['Badgar', 'Badger'],
  ['Kvar badge', 'Hver badge'],
  ['eigne kriterium', 'egne kriterier'],
  ['gjeld ikkje', 'gjelder ikke'],
  ['funne i', 'funnet i'],
  ['kontrollerast', 'kontrolleres'],
  ['henta frå', 'hentet fra'],
  ['frå ', 'fra '],
  ['Frå ', 'Fra '],
  ['offentlege', 'offentlige'],
  ['produsentopplysningar', 'produsentopplysninger'],
  ['Kjelde ikkje', 'Kilde ikke'],
  ['Kjelder', 'Kilder'],
  ['poengtrekk', 'poengtrekk'],
  ['utelukka', 'utelukket'],
  ['deklarasjonar', 'deklarasjoner'],
  ['poengsummen', 'poengsummen'],
  ['laboratoriemålt', 'laboratoriemålt'],
  ['Smakstilsett', 'Smakstilsett'],
  ['nøytral', 'nøytral'],
  ['utan ', 'uten '],
  ['Utan ', 'Uten '],
  ['tydeleg', 'tydelig'],
  ['eige labresultat', 'eget labresultat'],
  ['eigne krav', 'egne krav'],
  ['Eit enkelt', 'Et enkelt'],
  ['eit ', 'et '],
  [' — ikkje ', ' — ikke '],
]

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, files)
    else if (['.ts', '.tsx'].includes(extname(p))) files.push(p)
  }
  return files
}

let fileCount = 0
for (const file of walk(root)) {
  let content = readFileSync(file, 'utf8')
  const original = content
  for (const [from, to] of replacements) {
    content = content.split(from).join(to)
  }
  if (content !== original) {
    writeFileSync(file, content)
    fileCount++
  }
}

console.log(`normalize-bokmal: updated ${fileCount} files`)
