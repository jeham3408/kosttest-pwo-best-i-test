import { blogPosts } from '../data/blog'
import { testedCreatineProducts, type TestedCreatineProduct } from '../data/creatineProducts'
import { testedProteinProducts, type TestedProteinProduct } from '../data/proteinProducts'
import { testedProducts, PWO_FORMULA_MAX_POINTS, type TestedProduct } from '../data/pwoProducts'
import { siteStats } from '../siteStats'
import { normalizePath } from '../routing'

const base = 'https://kosttest.no'

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kosttest.no',
  url: `${base}/`,
  logo: `${base}/brand/logo-light.png`,
  description: 'Deklarasjonsanalyse av kosttilskudd med åpen metode. Ingen sponsede plasseringer.',
  sameAs: [`${base}/`, 'https://www.facebook.com/kosttest.no', 'https://twitter.com/kosttestno'],
}

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Kosttest.no',
  url: `${base}/`,
  inLanguage: 'nb-NO',
}

const breadcrumb = (items: { name: string; url: string }[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: base + item.url,
  })),
})

const faqPage = (items: { q: string; a: string }[]) => ({
  '@type': 'FAQPage',
  mainEntity: items.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
})

type ProductSchemaInput = {
  name: string
  verdict: string
  brand: string
  image?: string | null
  priceNok?: number | null
}

/** Product schema uten Review/Rating — unngår misvisande «testresultat» i søk. */
function productSchema(product: ProductSchemaInput, path: string) {
  const schema: Record<string, unknown> = {
    '@type': 'Product',
    name: product.name,
    description: product.verdict.substring(0, 500),
    url: `${base}${path}/`,
    brand: { '@type': 'Brand', name: product.brand },
  }
  if (product.image) {
    schema.image = product.image.startsWith('/') ? `${base}${product.image}` : product.image
  }
  if (product.priceNok != null && product.priceNok > 0) {
    schema.offers = {
      '@type': 'Offer',
      price: product.priceNok,
      priceCurrency: 'NOK',
      availability: 'https://schema.org/InStock',
    }
  }
  return schema
}

const blogPublishedDates: Record<string, { published: string; modified: string }> = {
  'l-citrulline': { published: '2026-05-04', modified: '2026-06-20' },
  'beta-alanin': { published: '2026-05-06', modified: '2026-06-18' },
  kreatin: { published: '2026-05-08', modified: '2026-06-22' },
  koffein: { published: '2026-05-10', modified: '2026-06-15' },
  arginin: { published: '2026-05-12', modified: '2026-06-10' },
  'sammenligning-peveo-sickpump': { published: '2026-05-20', modified: '2026-06-27' },
  'sammenligning-peveo-supervillain': { published: '2026-05-20', modified: '2026-06-27' },
  'sammenligning-midnight-stimfree': { published: '2026-05-22', modified: '2026-06-27' },
  'sammenligning-sickpump-noxplode': { published: '2026-05-22', modified: '2026-06-27' },
  'sammenligning-gold-supreme': { published: '2026-05-22', modified: '2026-06-27' },
}

type JsonLdProps = {
  path?: string
  product?: TestedProduct
  proteinProduct?: TestedProteinProduct
  creatineProduct?: TestedCreatineProduct
}

export default function JsonLd({ path: rawPath, product, proteinProduct, creatineProduct }: JsonLdProps) {
  const path = normalizePath(rawPath || '/')
  const def = [orgSchema, webSiteSchema]

  if (path.startsWith('/kreatin/') && creatineProduct) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            productSchema(creatineProduct, path),
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'Kreatin – sammenligning', url: '/tester/kreatin/' },
              { name: creatineProduct.name, url: `/kreatin/${creatineProduct.id}/` },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.startsWith('/protein/') && proteinProduct) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            productSchema(proteinProduct, path),
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'Proteinpulver – sammenligning', url: '/tester/protein/' },
              { name: proteinProduct.name, url: `/protein/${proteinProduct.id}/` },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.startsWith('/pwo/') && product) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            productSchema(product, path),
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'PWO – sammenligning', url: '/tester/pwo/' },
              { name: product.name, url: `/pwo/${product.id}/` },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.includes('/slik-velger-du')) {
    const isCreatine = path.includes('/kreatin/')
    const isProtein = path.includes('/protein/')
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            {
              '@type': 'HowTo',
              name: isCreatine ? 'Slik velger du kreatin' : isProtein ? 'Slik velger du proteinpulver' : 'Slik velger du riktig PWO',
              step: isCreatine
                ? [
                    { '@type': 'HowToStep', position: 1, name: 'Velg monohydrat', text: 'Kreatin monohydrat er best dokumentert. Creapure er en kvalitetssertifisert variant.' },
                    { '@type': 'HowToStep', position: 2, name: 'Sjekk dokumentasjon', text: 'Se etter oppgitt renhet, mesh og dopingtest på ferdigproduktet — også Creapure må ha produkttest (Cologne List, Informed Sport m.fl.).' },
                  ]
                : [
                    { '@type': 'HowToStep', position: 1, name: 'Forstå hva en PWO er', text: 'En PWO (Pre-Workout) er et kosttilskudd du ofte tar før trening. Mange kombinerer koffein og aminosyrer — effekt varierer mellom personer.' },
                    { '@type': 'HowToStep', position: 2, name: 'Se etter nøkkelingredienser', text: 'L-citrulline (4000-10000 mg), beta-alanin (3200-6400 mg), koffein (100-300 mg).' },
                  ],
            },
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'Kjøpsguide', url: path + '/' },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.startsWith('/tester/kreatin')) {
    const top = testedCreatineProducts[0]
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            {
              '@type': 'ItemList',
              name: 'Kreatin – sammenligning 2026',
              url: `${base}${path}/`,
              numberOfItems: testedCreatineProducts.length,
              itemListElement: testedCreatineProducts.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                url: `${base}/kreatin/${item.id}/`,
              })),
            },
            faqPage([
              {
                q: 'Hva er det beste kreatinet i Norge 2026?',
                a: top
                  ? `${top.name} topper rangeringen vår med score ${top.score}/100 basert på merkevare-kreatin, renhet, mesh og dokumentasjon.`
                  : 'Se hele kreatinrangeringen for oppdatert topp 1 basert på åpen score.',
              },
              {
                q: 'Er Creapure bedre enn kreatin uten oppgitt merkevare?',
                a: 'Creapure er sertifisert tysk monohydrat med dokumentert renhet. I vår test krever vi likevel dopingtest på ferdigproduktet — uten det får også Creapure poengtrekk.',
              },
            ]),
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'Kreatin – sammenligning', url: '/tester/kreatin/' },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.startsWith('/tester/protein')) {
    const top = testedProteinProducts[0]
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            {
              '@type': 'ItemList',
              name: 'Proteinpulver – sammenligning 2026',
              url: `${base}${path}/`,
              numberOfItems: testedProteinProducts.length,
              itemListElement: testedProteinProducts.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                url: `${base}/protein/${item.id}/`,
              })),
            },
            faqPage([
              {
                q: 'Hvilket proteinpulver topper rangeringen 2026?',
                a: top
                  ? `${top.name} leder rangeringen med score ${top.score}/100. Vi bruker DIAAS som primær kvalitetsmåling for protein.`
                  : 'Se proteinrangeringen for oppdatert topp 1 basert på DIAAS og åpen metode.',
              },
              {
                q: 'Hva er DIAAS for proteinpulver?',
                a: 'DIAAS (Digestible Indispensable Amino Acid Score) måler hvor godt proteinet dekker kroppens aminosyrebehov. FAO anbefaler DIAAS som gullstandard fremfor PDCAAS.',
              },
            ]),
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'Proteinpulver – sammenligning', url: '/tester/protein/' },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.startsWith('/tester/pwo')) {
    const top = testedProducts[0]
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            {
              '@type': 'ItemList',
              name: 'PWO – sammenligning 2026',
              url: `${base}${path}/`,
              numberOfItems: testedProducts.length,
              itemListElement: testedProducts.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                url: `${base}/pwo/${item.id}/`,
              })),
            },
            faqPage([
              {
                q: 'Hva er den beste PWO i Norge 2026?',
                a: top
                  ? `${top.name} leder rangeringen per ${new Date().getFullYear()} med formelscore ${top.score}/${PWO_FORMULA_MAX_POINTS} basert på deklarerte ingredienser og dose per serving.`
                  : 'Se PWO-rangeringen for oppdatert topp 1 uten sponsede plasseringer.',
              },
              {
                q: 'Hvordan vurderer Kosttest.no PWO?',
                a: 'Vi scorer deklarerte ingredienser og doser per serving etter publiserte kriterier. Ingen produsent kan kjøpe plassering. Dette er deklarasjonsanalyse — ikke laboratorietest av Kosttest.',
              },
              {
                q: 'Hvilken PWO er best for nybegynnere?',
                a: 'Velg produkter med moderat koffein (100–200 mg) og dokumenterte doser av L-citrulline. Se filteret for nybegynnere eller stim-free alternativer.',
              },
            ]),
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'PWO – sammenligning', url: '/tester/pwo/' },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.startsWith('/blogg/') && path !== '/blogg') {
    const slug = path.replace('/blogg/', '')
    const post = blogPosts.find((entry) => entry.slug === slug || entry.id === slug)
    if (post) {
      const dates = blogPublishedDates[post.slug] ?? blogPublishedDates[post.id] ?? {
        published: '2026-06-01',
        modified: '2026-06-27',
      }
      return (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              ...def,
              {
                '@type': 'Article',
                headline: post.title,
                description: post.excerpt,
                datePublished: dates.published,
                dateModified: dates.modified,
                inLanguage: 'nb-NO',
                author: { '@type': 'Organization', name: 'Kosttest.no' },
                publisher: {
                  '@type': 'Organization',
                  name: 'Kosttest.no',
                  logo: { '@type': 'ImageObject', url: `${base}/brand/logo-light.png` },
                },
                mainEntityOfPage: `${base}/blogg/${post.slug}/`,
              },
              breadcrumb([
                { name: 'Hjem', url: '/' },
                { name: 'Blogg', url: '/blogg/' },
                { name: post.title, url: `/blogg/${post.slug}/` },
              ]),
            ]),
          }}
        />
      )
    }
  }

  if (path === '/' || path === '') {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            {
              '@type': 'WebPage',
              name: 'PWO, protein og kreatin – sammenligning 2026',
              description: `Deklarasjonsanalyse av ${siteStats.totalTestedCount} kosttilskudd i ${siteStats.categoryCount} kategorier.`,
              url: `${base}/`,
              inLanguage: 'nb-NO',
            },
            faqPage([
              {
                q: 'Hva er Kosttest.no?',
                a: 'Kosttest.no sammenligner PWO, proteinpulver og kreatin etter åpen metode basert på deklarasjon — uten sponsede plasseringer.',
              },
              {
                q: 'Hvilke kosttilskudd tester dere?',
                a: `Vi tester pre-workout (PWO), proteinpulver og kreatin. Totalt ${siteStats.totalTestedCount} produkter med offentlig score og dokumentert metode.`,
              },
            ]),
            breadcrumb([{ name: 'Hjem', url: '/' }]),
          ]),
        }}
      />
    )
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([
          ...def,
          breadcrumb([{ name: 'Hjem', url: '/' }]),
        ]),
      }}
    />
  )
}
