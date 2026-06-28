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
      ? `Merkevare-kreatin: ${product.creatineBrand ?? 'Creapure®'}. Dette gir høyere grunnscore enn produkter uten oppgitt merkevare — men dopingtest på ferdigproduktet kreves likevel.`
      : 'Produsenten oppgir ikke merkevare på kreatin-råstoffet. Da er dokumentert renhet, mesh og dopingtest spesielt viktig.',
    purityAnalysis: purityDeclared
      ? `Renhet oppgitt: ${product.purityPercent!.toString().replace('.', ',')} %.`
      : 'Renhet i prosent er ikke oppgitt — det gir poengtrekk i testen.',
    meshAnalysis: meshDeclared
      ? `Mesh oppgitt: ${product.meshLabel}.`
      : 'Partikkelstørrelse (mesh) er ikke oppgitt — «mikronisert» alene er ikke nok.',
    dopingAnalysis: dopingDeclared
      ? `Dopingtest dokumentert: ${product.dopingTestLabel}.`
      : branded
        ? 'Ingen dokumentert dopingtest på ferdigproduktet — vi trekker poeng selv om råstoffet er Creapure/merkevare. Utøvere bør velge produkt med Cologne List®, Informed Sport eller tilsvarende.'
        : 'Ingen dokumentert dopingtest (Cologne List, Informed Sport m.fl.) — viktig minus, særlig for utøvere.',
    formAnalysis: branded
      ? `${product.creatineBrand ?? 'Merkevare-kreatin'} — kontrollert råstoff med høyere grunnscore.`
      : product.form === 'micronized'
        ? 'Mikronisert monohydrat — lavere grunnscore enn merkevare-kreatin.'
        : product.form === 'capsules'
          ? 'Tablettformat er praktisk, men scorer lavest på form blant pulverprodukter.'
          : product.form === 'blend'
            ? 'Blandingsprodukt med ekstra ingredienser — lavest egnethet i ren kvalitetstest.'
            : 'Monohydrat — OK form, men krever ekstra dokumentasjon når merkevare ikke er oppgitt.',
    priceAnalysis: `${product.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr per gram kreatin (kun referanse — pris påvirker ikke scoren).`,
    bestFor: dopingDeclared
      ? branded
        ? 'Deg som vil ha merkevare-kreatin (Creapure m.fl.) med dokumentert dopingtest.'
        : 'Deg som vil ha monohydrat med dokumentert dopingtest, uten krav om merkevare-råstoff.'
      : branded
        ? 'Casual bruk der dopingkontroll ikke er relevant — men utøvere bør velge produkt med dokumentert test.'
        : 'Kun casual bruk — utøvere bør velge merkevare-kreatin eller produkt med dokumentert dopingtest.',
    notFor: !dopingDeclared
      ? 'Utøvere i testet idrett uten dokumentert dopingkontroll på produktet.'
      : product.form === 'blend'
        ? 'Deg som vil ha ren monohydrat uten sukker og ekstra fyllstoff.'
        : 'Ingen spesielle begrensninger utover vanlige råd om væske og konsistens.',
    bottomLine: `Score ${product.score}/100 — ${branded ? 'merkevare-kreatin' : 'merkevare på råstoff ikke oppgitt'}${!purityDeclared || !meshDeclared || !dopingDeclared ? ', med trekk for manglende dokumentasjon' : ''}.`,
    faq: [
      {
        question: 'Hvorfor betyr merkevare-kreatin noe?',
        answer: 'Creapure og andre merkevarer har kontrollert produksjon, oppgitt renhet og sporbarhet. Produkter uten oppgitt merkevare kan være like bra, men da må produsenten dokumentere kvaliteten selv.',
      },
      {
        question: 'Må kreatin være dopingtestet — også Creapure?',
        answer: 'Ja, for utøvere og i vår score. Creapure sikrer råstoffkvalitet, men ferdigproduktet må testes separat (Cologne List®, Informed Sport m.fl.). Uten dokumentert produkttest trekker vi 15 poeng — også på Creapure.',
      },
      {
        question: 'Påvirker prisen rangeringen?',
        answer: 'Nei. Kreatintesten er 100 % kvalitet — merkevare, renhet, mesh og dopingtest. Pris vises kun som referanse.',
      },
    ],
  }
}
