import type { TestedCreatineProduct } from './data/creatineProducts'
import {
  hasDopingTestDisclosure,
  hasMeshDisclosure,
  hasPurityDisclosure,
  isBrandedCreatine,
} from './data/creatineScoring'

export function generateCreatineContent(product: TestedCreatineProduct) {
  const branded = isBrandedCreatine(product)
  const purityDeclared = hasPurityDisclosure(product.purityPercent)
  const meshDeclared = hasMeshDisclosure(product.meshLabel)
  const dopingDeclared = hasDopingTestDisclosure(product.dopingTestLabel)

  return {
    summary: product.verdict,
    sourceAnalysis: branded
      ? `Merkevare-kreatin: ${product.creatineBrand ?? 'Creapure®'}. Dette gir høyere grunnscore enn generisk mono.`
      : 'Generisk kreatin monohydrat — uten merkevare på råstoffet. Da er dokumentert renhet, mesh og dopingtest spesielt viktig.',
    purityAnalysis: purityDeclared
      ? `Renhet oppgitt: ${product.purityPercent!.toString().replace('.', ',')} %.`
      : 'Renhet i prosent er ikke oppgitt — det gir poengtrekk i testen.',
    meshAnalysis: meshDeclared
      ? `Mesh oppgitt: ${product.meshLabel}.`
      : 'Partikkelstørrelse (mesh) er ikke oppgitt — «mikronisert» alene er ikke nok.',
    dopingAnalysis: dopingDeclared
      ? `Dopingtest dokumentert: ${product.dopingTestLabel}.`
      : branded
        ? 'Merkevare-kreatin har egen kvalitetssikring — produkttest er et pluss, men ikke påkrevd som for generisk.'
        : 'Ingen dokumentert dopingtest (Cologne List, Informed Sport m.fl.) — viktig minus for generisk kreatin, særlig for utøvere.',
    formAnalysis: branded
      ? `${product.creatineBrand ?? 'Merkevare-kreatin'} — kontrollert råstoff med høyere grunnscore.`
      : product.form === 'micronized'
        ? 'Generisk mikronisert monohydrat — lavere grunnscore enn merkevare-kreatin.'
        : product.form === 'capsules'
          ? 'Tablettformat er praktisk, men scorer lavest på form blant pulverprodukter.'
          : product.form === 'blend'
            ? 'Blandingsprodukt med ekstra ingredienser — lavest egnethet i ren kvalitetstest.'
            : 'Generisk monohydrat — OK form, men krever ekstra dokumentasjon.',
    priceAnalysis: `${product.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr per gram kreatin (kun referanse — pris påvirker ikke scoren).`,
    bestFor: branded
      ? 'Deg som vil ha merkevare-kreatin (Creapure m.fl.) med dokumentert kvalitet.'
      : dopingDeclared
        ? 'Deg som vil ha generisk mono, men med dokumentert dopingtest.'
        : 'Kun casual bruk — utøvere bør velge merkevare-kreatin eller generisk med dopingtest.',
    notFor: !branded && !dopingDeclared
      ? 'Utøvere i testet idrett uten dokumentert dopingkontroll på produktet.'
      : product.form === 'blend'
        ? 'Deg som vil ha ren monohydrat uten sukker og ekstra fyllstoff.'
        : 'Ingen spesielle begrensninger utover vanlige råd om væske og konsistens.',
    bottomLine: `Score ${product.score}/100 — ${branded ? 'merkevare-kreatin' : 'generisk'}${!purityDeclared || !meshDeclared || (!branded && !dopingDeclared) ? ', med trekk for manglende dokumentasjon' : ''}.`,
    faq: [
      {
        question: 'Hvorfor betyr merkevare-kreatin noe?',
        answer: 'Creapure og andre merkevarer har kontrollert produksjon, oppgitt renhet og sporbarhet. Generisk mono kan være like bra, men da må produsenten dokumentere kvaliteten selv.',
      },
      {
        question: 'Må generisk kreatin være dopingtestet?',
        answer: 'For utøvere ja — vi anbefaler Cologne List®, Informed Sport eller tilsvarende. Uten merkevare-kreatin trekker vi 15 poeng hvis dopingtest ikke er dokumentert.',
      },
      {
        question: 'Påvirker prisen rangeringen?',
        answer: 'Nei. Kreatintesten er 100 % kvalitet — merkevare, renhet, mesh og dopingtest. Pris vises kun som referanse.',
      },
    ],
  }
}
