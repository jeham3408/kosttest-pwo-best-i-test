import { blogPosts } from '../data/blog'
import { testedCreatineProducts, type TestedCreatineProduct } from '../data/creatineProducts'
import { testedProteinProducts, type TestedProteinProduct } from '../data/proteinProducts'
import { testedProducts, type TestedProduct } from '../data/pwoProducts'
import { normalizePath } from '../routing'

const base = 'https://kosttest.no'

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kosttest.no',
  url: `${base}/`,
  description: 'Uavhengig rangering av kosttilskudd med åpen karaktermotor. Ingen sponsede plasseringer.',
  sameAs: [`${base}/`, 'https://www.facebook.com/kosttest.no', 'https://twitter.com/kosttestno'],
}

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Kosttest.no',
  url: `${base}/`,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${base}/tester/pwo/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
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

type JsonLdProps = {
  path?: string
  product?: TestedProduct
  proteinProduct?: TestedProteinProduct
  creatineProduct?: TestedCreatineProduct
}

export default function JsonLd({ path: rawPath, product, proteinProduct, creatineProduct }: JsonLdProps) {
  const path = normalizePath(rawPath || '/')
  const def = [orgSchema, webSiteSchema]

  if (path.startsWith('/protein/') && proteinProduct) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            {
              '@type': 'Product',
              name: proteinProduct.name,
              description: proteinProduct.verdict,
              url: `${base}${path}/`,
              image: proteinProduct.image,
              brand: { '@type': 'Brand', name: proteinProduct.brand },
              offers: {
                '@type': 'Offer',
                price: proteinProduct.priceNok,
                priceCurrency: 'NOK',
                availability: 'https://schema.org/InStock',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: proteinProduct.score,
                bestRating: 100,
                ratingCount: 1,
              },
            },
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'Proteinpulver best i test', url: '/tester/protein/' },
              { name: proteinProduct.name, url: `/protein/${proteinProduct.id}/` },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.startsWith('/kreatin/') && creatineProduct) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            {
              '@type': 'Product',
              name: creatineProduct.name,
              description: creatineProduct.verdict,
              url: `${base}${path}/`,
              image: creatineProduct.image,
              brand: { '@type': 'Brand', name: creatineProduct.brand },
              offers: {
                '@type': 'Offer',
                price: creatineProduct.priceNok,
                priceCurrency: 'NOK',
                availability: 'https://schema.org/InStock',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: creatineProduct.score,
                bestRating: 100,
                ratingCount: 1,
              },
            },
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'Kreatin best i test', url: '/tester/kreatin/' },
              { name: creatineProduct.name, url: `/kreatin/${creatineProduct.id}/` },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.startsWith('/pwo/') && product) {
    const content = product.verdict
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            {
              '@type': 'Product',
              name: product.name,
              description: content,
              url: `${base}${path}/`,
              image: product.image,
              brand: { '@type': 'Brand', name: product.brand },
              offers: {
                '@type': 'Offer',
                price: product.priceNok,
                priceCurrency: 'NOK',
                availability: 'https://schema.org/InStock',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.score,
                bestRating: 100,
                ratingCount: 1,
              },
            },
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'PWO best i test', url: '/tester/pwo/' },
              { name: product.name, url: `/pwo/${product.id}/` },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.includes('/slik-velger-du')) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            {
              '@type': 'HowTo',
              name: 'Slik velger du riktig PWO',
              step: [
                { '@type': 'HowToStep', position: 1, name: 'Forstå hva en PWO er', text: 'En PWO (Pre-Workout) er et kosttilskudd du tar før trening for energi, fokus, utholdenhet og muskelpump.' },
                { '@type': 'HowToStep', position: 2, name: 'Se etter nøkkelingredienser', text: 'L-citrulline (4000-10000 mg), beta-alanin (3200-6400 mg), koffein (100-300 mg) og rødbetekstrakt er de viktigste ingrediensene i en PWO.' },
                { '@type': 'HowToStep', position: 3, name: 'Velg etter behov', text: 'Maksimal pump: 6000+ mg L-citrulline. Kveldstrening: velg stim-free. Nybegynner: start med lav koffein (100-200 mg).' },
                { '@type': 'HowToStep', position: 4, name: 'Unngå fellene', text: 'Styr unna proprietary blends og produkter uten oppgitte mengder. BCAA i PWO er unødvendig ved tilstrekkelig proteininntak.' },
                { '@type': 'HowToStep', position: 5, name: 'Bruk en åpen karaktermotor', text: 'Vår test vektlegger L-citrulline, arginin, rødbetekstrakt og andre ingredienser — ikke koffein eller pris. Se hele rangeringen på kosttest.no.' },
              ],
            },
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'Kjøpsguide', url: '/tester/pwo/slik-velger-du/' },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.startsWith('/tester/kreatin')) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            {
              '@type': 'ItemList',
              name: 'Kreatin best i test 2026',
              url: `${base}${path}/`,
              itemListElement: testedCreatineProducts.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                url: `${base}/kreatin/${item.id}/`,
              })),
            },
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'Kreatin best i test', url: '/tester/kreatin/' },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.startsWith('/tester/protein')) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            {
              '@type': 'ItemList',
              name: 'Proteinpulver best i test 2026',
              url: `${base}${path}/`,
              itemListElement: testedProteinProducts.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                url: `${base}/protein/${item.id}/`,
              })),
            },
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'Proteinpulver best i test', url: '/tester/protein/' },
            ]),
          ]),
        }}
      />
    )
  }

  if (path.startsWith('/tester/pwo')) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...def,
            {
              '@type': 'ItemList',
              name: 'PWO best i test 2026',
              url: `${base}${path}/`,
              itemListElement: testedProducts.slice(0, 45).map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                url: `${base}/pwo/${item.id}/`,
              })),
            },
            breadcrumb([
              { name: 'Hjem', url: '/' },
              { name: 'PWO best i test', url: '/tester/pwo/' },
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
                datePublished: '2026-05-04',
                dateModified: '2026-06-26',
                author: { '@type': 'Organization', name: 'Kosttest.no' },
                publisher: { '@type': 'Organization', name: 'Kosttest.no' },
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([
          ...def,
          {
            '@type': 'Article',
            headline: 'PWO best i test 2026: ærlig rangering av pre-workout i Norge',
            datePublished: '2026-05-04',
            dateModified: '2026-06-26',
            author: { '@type': 'Organization', name: 'Kosttest.no' },
            publisher: { '@type': 'Organization', name: 'Kosttest.no' },
          },
          breadcrumb([
            { name: 'Hjem', url: '/' },
            { name: 'PWO best i test', url: '/tester/pwo/' },
          ]),
        ]),
      }}
    />
  )
}
