import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { brand } from '../brand'
import type { AppPage } from '../routing'

type SiteHeaderProps = {
  page: AppPage
  onNavigate: (page: AppPage, productId?: string | null) => void
  onNavigatePath: (path: string) => void
}

export default function SiteHeader({ page, onNavigate, onNavigatePath }: SiteHeaderProps) {
  const [testsOpen, setTestsOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  const isTestActive =
    page === 'lb-pwo' ||
    page === 'lb-protein' ||
    page === 'lb-creatine' ||
    page === 'product' ||
    page === 'protein-product' ||
    page === 'creatine-product' ||
    page === 'metode' ||
    page === 'protein-metode' ||
    page === 'creatine-metode' ||
    page === 'buying-guide' ||
    page === 'protein-guide'

  const go = (path: string) => {
    onNavigatePath(path)
    setTestsOpen(false)
  }

  useEffect(() => {
    if (!testsOpen || !triggerRef.current) return
    const update = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      const menuWidth = 480
      const margin = 12
      let left = rect.left
      if (left + menuWidth > window.innerWidth - margin) {
        left = window.innerWidth - menuWidth - margin
      }
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
  }, [testsOpen])

  const menu = testsOpen
    ? createPortal(
        <>
          <button
            type="button"
            className="nav-dropdown-backdrop"
            aria-label="Lukk testmeny"
            onClick={() => setTestsOpen(false)}
          />
          <div
            className="nav-dropdown-menu nav-dropdown-wide nav-dropdown-fixed"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <div className="nav-dropdown-col">
              <span className="nav-dropdown-label">Pre-workout</span>
              <a href="/tester/pwo/" onClick={(e) => { e.preventDefault(); go('/tester/pwo/') }}>PWO best i test</a>
              <a href="/tester/pwo/stim-free/" onClick={(e) => { e.preventDefault(); go('/tester/pwo/stim-free/') }}>Stim-free</a>
              <a href="/tester/pwo/slik-velger-du/" onClick={(e) => { e.preventDefault(); go('/tester/pwo/slik-velger-du/') }}>Kjøpsguide PWO</a>
            </div>
            <div className="nav-dropdown-col">
              <span className="nav-dropdown-label">Protein</span>
              <a href="/tester/protein/" onClick={(e) => { e.preventDefault(); go('/tester/protein/') }}>Protein best i test</a>
              <a href="/tester/protein/vegan/" onClick={(e) => { e.preventDefault(); go('/tester/protein/vegan/') }}>Vegan protein</a>
              <a href="/tester/protein/metode/" onClick={(e) => { e.preventDefault(); go('/tester/protein/metode/') }}>Metode protein</a>
            </div>
            <div className="nav-dropdown-col">
              <span className="nav-dropdown-label">Kreatin</span>
              <a href="/tester/kreatin/" onClick={(e) => { e.preventDefault(); go('/tester/kreatin/') }}>Kreatin best i test</a>
              <a href="/tester/kreatin/creapure/" onClick={(e) => { e.preventDefault(); go('/tester/kreatin/creapure/') }}>Creapure</a>
              <a href="/tester/kreatin/metode/" onClick={(e) => { e.preventDefault(); go('/tester/kreatin/metode/') }}>Metode kreatin</a>
            </div>
          </div>
        </>,
        document.body,
      )
    : null

  return (
    <header className="site-header">
      <a
        className="brand"
        href="/"
        onClick={(e) => {
          e.preventDefault()
          onNavigate('home')
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
      <nav aria-label="Hovednavigasjon" className="nav-main">
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
        <div
          ref={triggerRef}
          className={`nav-dropdown${testsOpen ? ' is-open' : ''}`}
        >
          <button
            type="button"
            className={`nav-link${isTestActive ? ' nav-active' : ''}`}
            onClick={() => setTestsOpen(!testsOpen)}
            aria-expanded={testsOpen}
          >
            Tester ▾
          </button>
        </div>
        {menu}
        <a
          href="/blogg/"
          onClick={(e) => {
            e.preventDefault()
            onNavigate('blog')
          }}
          className={page === 'blog' || page === 'blog-post' ? 'nav-active' : ''}
        >
          Blogg
        </a>
        <a
          href="/kilder/"
          onClick={(e) => {
            e.preventDefault()
            onNavigate('kilder')
          }}
          className={page === 'kilder' ? 'nav-active' : ''}
        >
          Kilder
        </a>
        <a
          href="/om-metoden/"
          onClick={(e) => {
            e.preventDefault()
            onNavigate('metode')
          }}
          className={page === 'metode' ? 'nav-active' : ''}
        >
          Metode
        </a>
      </nav>
    </header>
  )
}
