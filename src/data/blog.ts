export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  readMinutes: number
  content: string[]
  relatedProducts?: string[]
}

export function findBlogPost(idOrSlug: string | null | undefined): BlogPost | undefined {
  if (!idOrSlug) return undefined
  return blogPosts.find((p) => p.id === idOrSlug || p.slug === idOrSlug)
}

export const blogPosts: BlogPost[] = [
  {
    id: 'l-citrulline',
    title: 'L-citrulline: Alt du trenger å vite om pump og NO',
    slug: 'l-citrulline',
    excerpt: 'L-citrulline er den viktigaste ingrediensen for blodgjennomstrømming og pump. Her får du vitskapen bak dosering, former og effekt.',
    category: 'Ingrediensar',
    readMinutes: 6,
    relatedProducts: ['peveo-maxed', 'peveo-stim-free', 'nutritac-sickpump', 'stacker-extasis', 'bsn-noxplode-50'],
    content: [
      'Kort oppsummert: L-citrulline er den viktigaste ingrediensen for muskelpump i PWO. Effektiv dose: 4000–10000 mg. Citrulline malate 2:1 gir 67% reint citrulline. Kan kombinerast med rødbetekstrakt for synergi.',
      '• Kva er L-citrulline? Ein aminosyre som omdannast til arginin i nyrene, som aukar nitrogenoksid (NO) i kroppen. NO utvidar blodårene og gir betydeleg auka blodgjennomstrømming til musklane.',
      '• Effektiv dose: Kliniske studier viser 4000–6000 mg som minimum, 8000–10000 mg for maksimal effekt. Citrulline malate 2:1 inneheld ca. 67 % reint L-citrulline, 1:1 gir ca. 50 %. Utan ratio: 50 % konservativt.',
      '• Forskingsstøtte: ISSN bekreftar effekt på uthald og redusert muskelsårheit. Meta-analysar viser signifikant forbetring i styrke og power.',
      '• Synergi med rødbete: L-citrulline og rødbetekstrakt virkar via ulike NO-vegar og kan kombinerast for maksimal pump. Fleire topprodukt på Kosttest.no nyttar denne kombinasjonen.',
      '• Konklusjon: Prioriter produkt med minimum 4000 mg L-citrulline-ekvivalent. Sjekk om det er rein L-citrulline eller malat — malat gir mindre aktivt stoff per gram.',
    ],
  },
  {
    id: 'beta-alanin',
    title: 'Beta-alanin: Bufferen som gir deg fleire repetisjonar',
    slug: 'beta-alanin',
    excerpt: 'Beta-alanin aukar karnosinnivået i musklane og forseinkar melkesyreoppbygging. Men kvifor passar det dårleg i PWO?',
    category: 'Ingrediensar',
    readMinutes: 5,
    relatedProducts: ['mutant-madness', 'elit-savage', 'white-lion-supervillain', 'dns-piraya', 'chained-unchained'],
    content: [
      'Kort oppsummert: Beta-alanin aukar uthald via auka karnosinnivå, men krev dagleg dosering over tid. Akutt effekt i PWO er avgrensa. Effektiv dose: 3200–6400 mg dagleg i minst 30 dagar.',
      '• Kva er beta-alanin? Ein aminosyre som aukar karnosin i musklane. Karnosin verkar som buffer mot melkesyre og forseinkar utmattelse under høgintensiv trening.',
      '• Problem med akutt bruk: Karnosinlagra krev 30 dagar med 6400 mg dagleg for optimal effekt. Difor har beta-alanin mindre akuttverdi i PWO samanlikna med L-citrulline.',
      '• ISSN anbefaler: 4–6 g dagleg i minst 4 veker. Prikkinga (parestesi) er ufarleg og minkar ved jamn bruk.',
      '• Konklusjon: Beta-alanin er nyttig ved dagleg PWO-bruk, men har lågare vekt i vår test fordi effekten ikkje er akutt.',
    ],
  },
  {
    id: 'kreatin',
    title: 'Kreatin: Det mest forskingsbaserte tilskuddet',
    slug: 'kreatin',
    excerpt: 'Kreatin er eit av dei mest studerte kosttilskudda i verda, med solid støtte for styrke, muskelvekst og hjernehelse.',
    category: 'Ingrediensar',
    readMinutes: 7,
    relatedProducts: ['peveo-maxed', 'star-supreme', 'gold-standard', 'applied-abe', 'elit-savage'],
    content: [
      'Kreatinmonohydrat er gullstandarden for auka styrke og muskelvekst. Over 1000 randomiserte kontrollerte studier støttar effekten. Dosen er 3–5 g dagleg for vedlikehald.',
      'Kreatin trekker vatn inn i muskelcellene, noko som aukar cellevolum og stimulerer proteinsyntese. Det har også vist lovande effekt på kognitiv funksjon, spesielt hos eldre.',
      'Vi har valt å ikkje la kreatin telje i PWO-scoringa vår fordi effekten kjem over tid, ikkje akutt. Men kreatin er utan tvil eit av dei beste tilskudda du kan ta – det høyrer berre ikkje heime i ein akutt PWO-score.',
    ],
  },
  {
    id: 'koffein',
    title: 'Koffein: Energien som må brukast rett',
    slug: 'koffein',
    excerpt: 'Koffein er verdas mest brukte prestasjonsfremmande stoff. Men kor mykje er for mykje, og når bør du styre unna?',
    category: 'Ingrediensar',
    readMinutes: 5,
    relatedProducts: ['white-lion-original', 'star-ultimate', 'bsn-noxplode-50', 'hype-beast', 'dns-piraya'],
    content: [
      'Kort oppsummert: Koffein blokkerer adenosinreseptorar og aukar årvakenheit. Effektiv dose: 200–400 mg. Over 400 mg kan gi bivirkningar. Toleranse byggast raskt — ta pause kvar 8–12 veke. Ikkje ein del av scoringa vår.',
      '• Verkemåte: Blokkerer adenosinreseptorar → reduserer trettheit, aukar årvakenheit. Godt dokumentert for uthald og styrke.',
      '• Effektiv dose: 3–6 mg/kg kroppsvekt (200–400 mg for vaksne). Over 400 mg: risiko for hjertebank, søvnproblem, angst. For lite: ingen effekt.',
      '• Toleranse: Byggast raskt opp. Anbefalt 1–2 veker pause kvart 8–12 veke. L-theanin kan dempe bivirkningar.',
      '• I vår test: Koffein er ikkje med i scoringa. Effekten er for individuell. Du finn mg oppgitt per produkt — sjølv ansvarleg.',
    ],
  },
  {
    id: 'arginin',
    title: 'Arginin: NO-boostar med dårleg biotilgjengelegheit',
    slug: 'arginin',
    excerpt: 'Arginin er ein forløpar til nitrogenoksid, men blir i stor grad broten ned i tarmen før det når musklane.',
    category: 'Ingrediensar',
    readMinutes: 4,
    relatedProducts: ['nutritac-sickpump', 'abe-pump-3g', 'zoomad-moonstruck', 'g4n-eaa-pwo', 'olimp-r-weiler-focus'],
    content: [
      'Kort oppsummert: Arginin aukar NO via same veg som citrulline, men har dårleg biotilgjengelegheit. Tel 50 % i vår pump-score. Over 10 g kan gi kvalme.',
      '• Verkemåte: L-arginin er forløpar til NO, men brytast ned av enzymet arginase i tarmen. Berre ein liten del når blodbanen.',
      '• Scoring: Tel 50 % i vår pump-berekning. For å oppnå same effekt som L-citrulline må du ha dobbel dose.',
      '• Kvalmerisiko: Over 10 g arginin per dose kan gi kvalme. Kombiner med L-citrulline for synergi.',
      '• Konklusjon: Grei NO-boostar, men L-citrulline er betre. Sjå etter produkt som har begge for best effekt.',
    ],
  },
  {
    id: 'glycerol',
    title: 'Glyserol: Hyperhydrering for ekstrem pump',
    slug: 'glycerol',
    excerpt: 'Glyserol trekker vatn inn i muskelcellene og gir auka cellevolum og pump. Men dosen må vere høg for effekt.',
    category: 'Ingrediensar',
    readMinutes: 4,
    relatedProducts: ['stacker-extasis'],
    content: [
      'Glyserol (glycerol) er ein alkohol som kroppen bruker til hyperhydrering. Det trekker vatn inn i cellene og aukar plasmavolumet, noko som gir betydeleg auka pump og uthald.',
      'Effektiv dose er 20–30 g reint glyserol. Glysersize og HydroPrime inneheld 65 % glyserol, så du treng 30–45 g pulver for å nå effektiv dose. Dette er grunnen til at maks score krev 20 g reint glyserol.',
      'Forsking viser at glyserol kan auke uthald med opptil 24 % og redusere termisk belastning under trening i varme omgjevnader.',
    ],
  },
  {
    id: 'rødbetekstrakt',
    title: 'Rødbetekstrakt: Nitrat som konkurrer med citrulline',
    slug: 'rodbetekstrakt',
    excerpt: 'Rødbetekstrakt aukar NO via nitrat-nitritt-NO-vegen – ein annan biokjemisk veg enn L-citrulline.',
    category: 'Ingrediensar',
    readMinutes: 5,
    relatedProducts: ['nutritac-midnight', 'star-supreme', 'smartsupps-pwo', 'hype-beast', 'zoomad-moonstruck'],
    content: [
      'Rødbetekstrakt er rikt på nitrat (NO₃), som blir omdanna til nitritt (NO₂) av munnbakteriar og vidare til NO under sure forhold i kroppen.',
      'Effekten er samanliknbar med L-citrulline, men via ein annan biokjemisk veg. Difor gir vi rødbetekstrakt 90 % av verdien til L-citrulline i vår pump-berekning. Kombinasjonen av begge kan gi synergi.',
      'Studier viser at 300–500 mg nitrat (ca. 5000 mg rødbetekstrakt) kan forbetre uthald og redusere oksygenkostnaden ved trening.',
    ],
  },
  {
    id: 'betain',
    title: 'Betain: Styrke og uthald frå rødbeter',
    slug: 'betain',
    excerpt: 'Betain (trimetylglycin) er ein osmolytt som aukar styrke og uthald. Finnes naturleg i rødbeter.',
    category: 'Ingrediensar',
    readMinutes: 3,
    relatedProducts: ['chained-unchained', 'swedish-joker', 'pes-prolific', 'lean-lime', 'white-lion-supervillain'],
    content: [
      'Betain er eit derivat av aminosyren glycin. Det fungerer som ein osmolytt som hjelper cellene å halde på vatn, og som ein metyldonor som støttar leverfunksjon og restitusjon.',
      'Studier viser at 1500–6000 mg betain dagleg kan auke styrke og uthald, særleg i samansetjing med kreatin. I vår test får betain eigen vekt fordi det er veldokumentert, men mindre avgjerande enn pump.',
    ],
  },
  {
    id: 'taurin',
    title: 'Taurin: Meir enn berre energidrikk',
    slug: 'taurin',
    excerpt: 'Taurin støttar hjartefunksjon, hydrering og muskelkontraksjon – og har akutt effekt i PWO.',
    category: 'Ingrediensar',
    readMinutes: 3,
    relatedProducts: ['evolite-ultrapump', 'olimp-r-weiler-focus', 'elit-savage', 'mutant-madness', 'star-ultimate'],
    content: [
      'Taurin er ein aminosyre som finst i høge konsentrasjonar i muskelvev, hjarte og hjerne. Den har akutt effekt på muskelkontraksjon og hydrering, noko som gjer den relevant i PWO.',
      'Effektiv dose er 1000–6000 mg. Taurin kan forseinke utmattelse og redusere muskelskade etter trening. I motsetning til beta-alanin har taurin akutt effekt, noko som gjer den meir egna for PWO-bruk.',
    ],
  },
  {
    id: 'tyrosin',
    title: 'Tyrosin: Fokus under stress',
    slug: 'tyrosin',
    excerpt: 'Tyrosin er ein forløpar til dopamin og noradrenalin, og kan forbetre kognitiv funksjon under stress.',
    category: 'Ingrediensar',
    readMinutes: 3,
    content: [
      'Tyrosin er ein aminosyre som blir omdanna til dopamin, noradrenalin og adrenalin. Under stress og hard trening blir desse signalstoffa tappa, og tyrosin kan bidra til å oppretthalde fokus.',
      'Dosekravet er høgt: 10000–15000 mg for kognitiv effekt. Dei færraste PWO-ar inneheld nok tyrosin til å gi målebar effekt, difor får det låg vekt i testen.',
    ],
    relatedProducts: ['elit-savage', 'star-ultimate', 'pes-prolific', 'olimp-r-weiler-focus', 'applied-abe'],
  },
  {
    id: 'samanlikning-peveo-sickpump',
    title: 'Peveo Maxed vs NutriTac SickPump – Hvilken PWO er best?',
    slug: 'samanlikning-peveo-sickpump',
    excerpt: 'To av de beste PWO-ene i Norge. Peveo Maxed har 10g L-citrulline, SickPump har arginin og høgere dose. Les vår samanlikning.',
    category: 'Samanlikning',
    readMinutes: 5,
    relatedProducts: ['peveo-maxed', 'nutritac-sickpump'],
    content: [
      'Peveo Maxed og NutriTac SickPump VeinBlaster er to av de høyest rangerte PWO-ene på Kosttest.no. Begge scorer B, men har veldig forskjellige profiler.',
      'Peveo Maxed (58 poeng): 10 000 mg L-citrulline (via citrulline malate 2:1), 6400 mg beta-alanin, 5000 mg kreatin, 350 mg koffein. Dette er en komplett PWO med maksimal pump og utholdenhet. Ulempen er 350 mg koffein (mye for nybegynnere) og 5 skjeer for full dose.',
      'NutriTac SickPump VeinBlaster (55 poeng): 9000 mg L-citrulline, 6000 mg arginin, 200 mg koffein (ved dobbel dose). SickPump har lavere koffein men kompenserer med arginin som gir ekstra NO-produksjon. Perfekt for deg som vil ha pump uten å bli overstimulert.',
      'Vår vurdering: Velg Peveo Maxed hvis du vil ha maksimal effekt og tåler mye koffein. Velg SickPump hvis du vil ha god pump med moderat stimulans. Peveo vinner på beta-alanin og kreatin, SickPump vinner på lavere koffein og arginin.',
    ],
  },
  {
    id: 'samanlikning-peveo-supervillain',
    title: 'Peveo Maxed vs White Lion Supervillain – Hvilken er sterkest?',
    slug: 'samanlikning-peveo-supervillain',
    excerpt: 'To høydoserte PWO-er med helt forskjellige profiler. Peveo Maxed (58p) mot Supervillain (47p). Hvem vinner på pump, energi og verdi?',
    category: 'Samanlikning',
    readMinutes: 4,
    relatedProducts: ['peveo-maxed', 'white-lion-supervillain'],
    content: [
      'Peveo Maxed og White Lion Supervillain er begge høydoserte PWO-er, men med helt forskjellige tilnærminger.',
      'Peveo Maxed (58 poeng): 10 000 mg L-citrulline, 6400 mg beta-alanin, 5000 mg kreatin, 350 mg koffein. Full pakke med alt du trenger. Ulempen er 5 skjeer for full dose og høy koffein.',
      'White Lion Supervillain (47 poeng): 6667 mg L-citrulline-ekvivalent (via 10 000 mg citrulline malate 2:1), 5000 mg beta-alanin, 2500 mg betain, 300 mg koffein. Lettere tilgjengelig med 2 skjeer for full dose.',
      'Vår vurdering: Peveo vinner på ren styrke og kompletthet. Supervillain er enklere å dosere og har lavere koffein. Velg Peveo for maksimal effekt, Supervillain for en mer balansert opplevelse.',
    ],
  },
  {
    id: 'samanlikning-midnight-stimfree',
    title: 'Midnight Pump vs PWO-Stim-free – Beste stim-free PWO?',
    slug: 'samanlikning-midnight-stimfree',
    excerpt: 'To koffeinfrie PWO-er konkurrerer om tittelen beste stim-free. Midnight Pump (58p) fra NutriTac møter Peveo PWO-Stim-free (56p).',
    category: 'Samanlikning',
    readMinutes: 4,
    relatedProducts: ['nutritac-midnight', 'peveo-stim-free'],
    content: [
      'Midnight Pump Stim-Free (58 poeng) og Peveo PWO-Stim-free (56 poeng) er de to beste koffeinfrie PWO-ene på markedet.',
      'Midnight Pump: 10 000 mg rødbetekstrakt (gir 9000 mg pump-ekvivalent), 6000 mg beta-alanin, 4000 mg betain. Får pump via nitrat fra rødbeter i stedet for L-citrulline.',
      'Peveo PWO-Stim-free: 10 000 mg L-citrulline (ren), 5000 mg betain, 3000 mg taurin, 3000 mg tyrosin. Tradisjonell pump via L-citrulline.',
      'Vår vurdering: Midnight Pump vinner med høyere beta-alanin og rødbetebasert pump. Peveo har ren L-citrulline som er mer dokumentert. Begge er utmerkede valg — velg Midnight for beta-alanin-effekt, Peveo for ren citrulline-pump.',
    ],
  },
  {
    id: 'samanlikning-sickpump-noxplode',
    title: 'SickPump vs N.O.-Xplode – Beste PWO under 250 kr?',
    slug: 'samanlikning-sickpump-noxplode',
    excerpt: 'SickPump VeinBlaster (55p) mot klassikeren BSN N.O.-Xplode (38p). Er dobbel dose verdt prisen?',
    category: 'Samanlikning',
    readMinutes: 4,
    relatedProducts: ['nutritac-sickpump', 'bsn-noxplode-50'],
    content: [
      'NutriTac SickPump VeinBlaster (55 poeng) og BSN N.O.-Xplode (38 poeng) er i helt forskjellige prisklasser, men begge populære.',
      'SickPump (599 kr): 9000 mg L-citrulline, 6000 mg arginin, 200 mg koffein (dobbel dose). Ekstrem pump via kombinasjon av citrulline og arginin.',
      'N.O.-Xplode (679 kr, 50 porsjoner): 6000 mg L-citrulline, 3200 mg beta-alanin, 200 mg koffein. Klassisk formel med rhodiola rosea og piperin.',
      'Vår vurdering: SickPump gir mer pump for pengene, men N.O.-Xplode har lavere pris per porsjon (13,58 kr vs 51,33 kr). SickPump vinner på effekt, N.O.-Xplode på pris.',
    ],
  },
  {
    id: 'samanlikning-gold-supreme',
    title: 'Gold Standard vs Supreme PWO – Beste premium PWO?',
    slug: 'samanlikning-gold-supreme',
    excerpt: 'Optimum Nutrition Gold Standard (15p) mot Star Nutrition Supreme (33p). Hvorfor scorer Supreme dobbelt så høyt?',
    category: 'Samanlikning',
    readMinutes: 4,
    relatedProducts: ['gold-standard', 'star-supreme'],
    content: [
      'Optimum Nutrition Gold Standard (15 poeng) og Star Nutrition Supreme (33 poeng) er begge premium-produkter, men med stor forskjell i score.',
      'Gold Standard: 1500 mg L-citrulline, 1500 mg beta-alanin, 3000 mg kreatin, 175 mg koffein. Balansert men underdosert på pump.',
      'Supreme: 3000 mg L-citrulline, 3000 mg beta-alanin, 3000 mg kreatin, 200 mg koffein, 2000 mg rødbetekstrakt. Dobbelt dose av nøkkelingrediensene.',
      'Vår vurdering: Supreme vinner klart med dobbel L-citrulline og beta-alanin. Gold Standard er et trygt valg, men dosene er for lave til å konkurrere. Supreme gir mye mer for pengene.',
    ],
  },
]
