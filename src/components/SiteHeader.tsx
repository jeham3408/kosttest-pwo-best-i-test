import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Menu, X } from 'lucide-react'
import { brand } from '../brand'
import type { AppPage } from '../routing'

type SiteHeaderProps = {
  page: AppPage
  onNavigate: (page: AppPage, productId?: string | null) => void
  onNavigatePath: (path: string) => void
  compareCount?: number
  onOpenCompare?: () => void
}

type NavLink = { label: string; path: string }

const testLinks: NavLink[] = [
  { label: 'PWO-rangering', path: '/tester/pwo/' },
  { label: 'Protein sammenligning', path: '/tester/protein/' },
  { label: 'Kreatin-rangering', path: '/tester/kreatin/' },
]

const guideLinks: NavLink[] = [
  { label: 'Slik velger du PWO', path: '/tester/pwo/slik-velger-du/' },
  { label: 'Slik velger du protein', path: '/tester/protein/slik-velger-du/' },
  { label: 'Slik velger du kreatin', path: '/tester/kreatin/slik-velger-du/' },
  { label: 'Ingrediensertikler', path: '/blogg/' },
  { label: 'Metodeforklaring', path: '/om-metoden/' },
]

const aboutLinks: NavLink[] = [
  { label: 'Om Kosttest', path: '/om-kosttest/' },
  { label: 'Metode', path: '/om-metoden/' },
  { label: 'Kilder', path: '/kilder/' },
  { label: 'Hvor ferske er dataene?', path: '/hvor-ferske-er-dataene/' },
  { label: 'Slik finansieres siden', path: '/om-kosttest/#finansiering' },
  { label: 'Meld feil eller produkt', path: '/om-kosttest/#kontakt' },
]

export default function SiteHeader({
  page,
  onNavigate,
  onNavigatePath,
  compareCount = 0,
  onOpenCompare,
}: SiteHeaderProps) {
  const [openMenu, setOpenMenu] = useState<'tests' | 'guides' | 'about' | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const triggerRefs = {
    tests: useRef<HTMLDivElement>(null),
    guides: useRef<HTMLDivElement>(null),
    about: useRef<HTMLDivElement>(null),
  }

  const isTestActive =
    page === 'lb-pwo' ||
    page === 'lb-protein' ||
    page === 'lb-creatine' ||
    page === 'product' ||
    page === 'protein-product' ||
    page === 'creatine-product'

  const isGuideActive =
    page === 'buying-guide' ||
    page === 'protein-guide' ||
    page === 'creatine-guide' ||
    page === 'blog' ||
    page === 'blog-post' ||
    page === 'metode' ||
    page === 'protein-metode' ||
    page === 'creatine-metode'

  const isAboutActive =
    page === 'om-kosttest' ||
    page === 'kilder' ||
    page === 'data-freshness'

  const go = (path: string) => {
    onNavigatePath(path)
    setOpenMenu(null)
    setMobileOpen(false)
  }

  useEffect(() => {
    if (!openMenu) return
    const ref = triggerRefs[openMenu]
    if (!ref.current) return
    const update = () => {
      const rect = ref.current!.getBoundingClientRect()
      const menuWidth = 280
      const margin = 12
      let left = rect.left
      if (left + menuWidth > window.innerWidth - margin) left = window.innerWidth - menuWidth - margin
      left = Math.max(margin, left)
      setMenuPos({ top: rect.bottom + 4, left })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [openMenu])

  useEffect(() => {
    document.body.classList.toggle('nav-mobile-open', mobileOpen)
    return () => document.body.classList.remove('nav-mobile-open')
  }, [mobileOpen])

  const dropdownMenu = openMenu
    ? createPortal(
        <>
          <button
            type="button"
            className="nav-dropdown-backdrop"
            aria-label="Lukk meny"
            onClick={() => setOpenMenu(null)}
          />
          <div
            className="nav-dropdown-menu nav-dropdown-fixed"
            style={{ top: menuPos.top, left: menuPos.left, minWidth: 260 }}
          >
            {(openMenu === 'tests' ? testLinks : openMenu === 'guides' ? guideLinks : aboutLinks).map((link) => (
              <a
                key={link.path}
                href={link.path}
                onClick={(e) => {
                  e.preventDefault()
                  go(link.path)
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </>,
        document.body,
      )
    : null

  const navDropdown = (
    key: 'tests' | 'guides' | 'about',
    label: string,
    active: boolean,
  ) => (
    <div ref={triggerRefs[key]} className={`nav-dropdown${openMenu === key ? ' is-open' : ''}`}>
      <button
        type="button"
        className={`nav-link${active ? ' nav-active' : ''}`}
        onClick={() => setOpenMenu(openMenu === key ? null : key)}
        aria-expanded={openMenu === key}
      >
        {label} ▾
      </button>
    </div>
  )

  return (
    <header className="site-header">
      <a
        className="brand"
        href="/"
        onClick={(e) => {
          e.preventDefault()
          onNavigate('home')
          setMobileOpen(false)
        }}
      >
        <img
          src={brand.logoLight}
          alt="Kosttest.no"
          className="brand-logo"
          width={168}
          height={44}
          decoding="async"
        />
      </a>

      <nav aria-label="Hovednavigasjon" className="nav-main nav-main-desktop">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            onNavigate('home')
          }}
          className={page === 'home' ? 'nav-active' : ''}
        >
          Forside
        </a>
        {navDropdown('tests', 'Tester', isTestActive)}
        {navDropdown('guides', 'Guider', isGuideActive)}
        {navDropdown('about', 'Om Kosttest', isAboutActive)}
        {compareCount > 0 && onOpenCompare ? (
          <button type="button" className="nav-link nav-compare-link" onClick={onOpenCompare}>
            Sammenlign ({compareCount})
          </button>
        ) : null}
      </nav>

      <button
        type="button"
        className="nav-mobile-toggle"
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav-panel"
        aria-label={mobileOpen ? 'Lukk meny' : 'Åpne meny'}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {dropdownMenu}

      {mobileOpen ? (
        <nav id="mobile-nav-panel" className="nav-mobile-panel" aria-label="Mobilmeny">
          <a
            href="/"
            className={page === 'home' ? 'nav-active' : ''}
            onClick={(e) => {
              e.preventDefault()
              onNavigate('home')
              setMobileOpen(false)
            }}
          >
            Forside
          </a>
          <details className="nav-mobile-group">
            <summary>Tester</summary>
            {testLinks.map((l) => (
              <a key={l.path} href={l.path} onClick={(e) => { e.preventDefault(); go(l.path) }}>{l.label}</a>
            ))}
          </details>
          <details className="nav-mobile-group">
            <summary>Guider</summary>
            {guideLinks.map((l) => (
              <a key={l.path} href={l.path} onClick={(e) => { e.preventDefault(); go(l.path) }}>{l.label}</a>
            ))}
          </details>
          <details className="nav-mobile-group">
            <summary>Om Kosttest</summary>
            {aboutLinks.map((l) => (
              <a key={l.path} href={l.path} onClick={(e) => { e.preventDefault(); go(l.path) }}>{l.label}</a>
            ))}
          </details>
          {compareCount > 0 && onOpenCompare ? (
            <button type="button" className="nav-mobile-compare" onClick={() => { onOpenCompare(); setMobileOpen(false) }}>
              Sammenlign ({compareCount})
            </button>
          ) : null}
          <div className="nav-mobile-quick">
            <span className="nav-mobile-quick-label">Snarveier</span>
            <a href="/tester/pwo/stim-free/" onClick={(e) => { e.preventDefault(); go('/tester/pwo/stim-free/') }}>Koffeinfri PWO</a>
            <a href="/tester/protein/billigste/" onClick={(e) => { e.preventDefault(); go('/tester/protein/billigste/') }}>Billig protein</a>
            <a href="/tester/kreatin/?doping=1" onClick={(e) => { e.preventDefault(); go('/tester/kreatin/?doping=1') }}>Dopingtesta kreatin</a>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
