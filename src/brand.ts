/** Offisielle Kosttest.no brand-assets (public/brand/ og rot-faviconer). */
export const brand = {
  logoLight: '/brand/logo-light.png',
  logoDark: '/brand/logo-dark.png',
  iconLight: '/brand/icon-light.png',
  /** App-ikon med mørk bakgrunn (PWA / deling). Favicon genereres fra iconLight. */
  appIcon: '/brand/app-icon.png',
  openGraph: '/kosttest-open-graph-1200x630.png',
  homeHeroBanner: '/brand/home-hero-banner.png',
  homeHeroBannerMobile: '/brand/home-hero-banner-mobile.png',
  homeHeroBannerCharity: '/brand/home-hero-banner-charity.png',
  homeHeroBannerCharityMobile: '/brand/home-hero-banner-charity-mobile.png',
  /** Mobilbanner for metode/transparens — brukes utenfor karusellen, ikke som egen slide. */
  homeHeroBannerMethodMobile: '/brand/home-hero-banner-independent-mobile.png',
} as const
