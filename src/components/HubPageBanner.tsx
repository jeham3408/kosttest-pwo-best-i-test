import { hubBanners, type HubBannerId } from '../data/hubBanners'

type HubPageBannerProps = {
  bannerId: HubBannerId
  /** Skjult h1 for SEO når banner har bakt-inn tekst */
  title: string
}

export default function HubPageBanner({ bannerId, title }: HubPageBannerProps) {
  const banner = hubBanners[bannerId]

  return (
    <section className="hub-page-banner" aria-label={title}>
      <h1 className="sr-only">{title}</h1>
      <picture>
        <source media="(max-width: 767px)" srcSet={banner.mobile} />
        <img
          className="hub-page-banner-img"
          src={banner.desktop}
          alt={banner.alt}
          width={1916}
          height={821}
          decoding="async"
          fetchPriority="high"
        />
      </picture>
    </section>
  )
}
