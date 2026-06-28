import type { ReactNode } from 'react'
import PageHeader from './PageHeader'

type CategoryHeroProps = {
  badge?: string
  title: string
  lead: string
  children?: ReactNode
}

/** Hero for kategori-rangeringssider. */
export default function CategoryHero({ badge, title, lead, children }: CategoryHeroProps) {
  return (
    <section className="ui-category-hero hub-page-hero">
      {badge ? <p className="test-badge-inline">{badge}</p> : null}
      <PageHeader title={title} lead={lead} />
      {children}
    </section>
  )
}
