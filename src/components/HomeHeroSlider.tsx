import { useCallback, useEffect, useRef, useState } from 'react'
import { brand } from '../brand'
import { EDITORIAL } from '../data/editorialLabels'

type ImageSlide = {
  kind: 'image'
  id: string
  desktop: string
  mobile?: string
  alt: string
  label: string
  width: number
  height: number
}

type CopySlide = {
  kind: 'copy'
  id: 'independent'
  title: string
  lead: string
  alt: string
  label: string
  mobile?: string
}

type HeroSlide = ImageSlide | CopySlide

const slides: HeroSlide[] = [
  {
    kind: 'image',
    id: 'hero',
    desktop: brand.homeHeroBanner,
    mobile: brand.homeHeroBannerMobile,
    alt: 'Finn de beste kosttilskuddene — sammenlign produkter, se rangeringer og oppdag testvinnere uten kjøpte plasseringer på kosttest.no',
    label: 'Tester og rangeringer',
    width: 1916,
    height: 821,
  },
  {
    kind: 'copy',
    id: 'independent',
    title: 'Åpen, regelbasert sammenligning',
    lead: 'Produkter rangeres uten kjøpte plasseringer — etter publiserte regler og deklarasjonsanalyse, ikke laboratorietest av hver pose.',
    alt: EDITORIAL.openComparison,
    label: 'Åpen sammenligning',
    mobile: brand.homeHeroBannerIndependentMobile,
  },
  {
    kind: 'image',
    id: 'charity',
    desktop: brand.homeHeroBannerCharity,
    mobile: brand.homeHeroBannerCharityMobile,
    alt: 'FUCK CANCER — Kosttest har som mål å bli godkjent non-profit innen 2027. Alt overskudd fra annonser går til barnekreftforskning, rent vann og andre veldedige formål.',
    label: 'Formål og veldedighet',
    width: 1916,
    height: 821,
  },
]

type LoopSlide = HeroSlide & { loopKey: string }

const loopSlides: LoopSlide[] = [
  { ...slides[slides.length - 1], loopKey: 'clone-start' },
  ...slides.map((slide) => ({ ...slide, loopKey: slide.id })),
  { ...slides[0], loopKey: 'clone-end' },
]

const FIRST_POSITION = 1
const LAST_POSITION = slides.length

function slideHasMobile(slide: HeroSlide): slide is ImageSlide & { mobile: string } {
  return slide.kind === 'image' && 'mobile' in slide && Boolean(slide.mobile)
}

function copySlideHasMobile(slide: CopySlide): slide is CopySlide & { mobile: string } {
  return Boolean(slide.mobile)
}

function positionToActive(position: number) {
  if (position <= 0) return slides.length - 1
  if (position > LAST_POSITION) return 0
  return position - 1
}

const INTERVAL_MS = 7000
const SWIPE_THRESHOLD_PX = 50
const AXIS_LOCK_PX = 14
const AXIS_RATIO = 1.35
const SNAP_DURATION_MS = 820

type DragState = {
  startX: number
  startY: number
  axis: 'x' | 'y' | null
  locked: boolean
}

export default function HomeHeroSlider() {
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState(FIRST_POSITION)
  const [paused, setPaused] = useState(false)

  const sliderRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef(FIRST_POSITION)
  const dragRef = useRef<DragState | null>(null)
  const dragOffsetRef = useRef(0)
  const mouseDragging = useRef(false)

  const getWidth = useCallback(() => sliderRef.current?.offsetWidth ?? 0, [])

  const applyTransform = useCallback((offsetPx: number) => {
    const track = trackRef.current
    if (!track) return
    track.style.transform = `translate3d(calc(-${positionRef.current * 100}% + ${offsetPx}px), 0, 0)`
  }, [])

  const setTrackDragging = useCallback((dragging: boolean) => {
    trackRef.current?.classList.toggle('is-dragging', dragging)
  }, [])

  const jumpToPosition = useCallback((position: number) => {
    const track = trackRef.current
    if (!track) return

    track.classList.remove('is-snapping')
    track.style.transition = 'none'
    positionRef.current = position
    dragOffsetRef.current = 0
    applyTransform(0)
    setPosition(position)
    setActive(positionToActive(position))

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (trackRef.current) trackRef.current.style.transition = ''
      })
    })
  }, [applyTransform])

  const normalizeIfClone = useCallback(() => {
    if (positionRef.current > LAST_POSITION) {
      jumpToPosition(FIRST_POSITION)
      return true
    }
    if (positionRef.current < FIRST_POSITION) {
      jumpToPosition(LAST_POSITION)
      return true
    }
    setActive(positionToActive(positionRef.current))
    return false
  }, [jumpToPosition])

  const animateToOffset = useCallback((targetOffset: number, onComplete: () => void) => {
    const track = trackRef.current
    if (!track) {
      onComplete()
      return
    }

    setTrackDragging(false)
    track.style.transition = ''
    track.classList.add('is-snapping')
    applyTransform(targetOffset)

    let done = false
    const finish = () => {
      if (done) return
      done = true
      track.removeEventListener('transitionend', onTransitionEnd)
      onComplete()
    }

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== track || event.propertyName !== 'transform') return
      finish()
    }

    track.addEventListener('transitionend', onTransitionEnd)
    window.setTimeout(finish, SNAP_DURATION_MS + 80)
  }, [applyTransform, setTrackDragging])

  const animateToPosition = useCallback((nextPosition: number) => {
    const track = trackRef.current
    if (!track) return

    track.classList.remove('is-dragging')
    track.style.transition = ''
    track.classList.add('is-snapping')
    positionRef.current = nextPosition
    dragOffsetRef.current = 0
    setPosition(nextPosition)
    applyTransform(0)

    let done = false
    const finish = () => {
      if (done) return
      done = true
      track.removeEventListener('transitionend', onTransitionEnd)
      normalizeIfClone()
      track.classList.remove('is-snapping')
    }

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== track || event.propertyName !== 'transform') return
      finish()
    }

    track.addEventListener('transitionend', onTransitionEnd)
    window.setTimeout(finish, SNAP_DURATION_MS + 80)
  }, [applyTransform, normalizeIfClone])

  const commitPosition = useCallback((nextPosition: number) => {
    const track = trackRef.current
    if (!track) return

    track.classList.remove('is-snapping')
    track.style.transition = 'none'
    positionRef.current = nextPosition
    dragOffsetRef.current = 0
    applyTransform(0)
    setPosition(nextPosition)
    normalizeIfClone()

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (trackRef.current) trackRef.current.style.transition = ''
      })
    })
  }, [applyTransform, normalizeIfClone])

  const goTo = useCallback((index: number) => {
    const target = index + FIRST_POSITION
    if (target === positionRef.current) return
    setPaused(true)
    dragOffsetRef.current = 0
    animateToPosition(target)
  }, [animateToPosition])

  const goNext = useCallback(() => {
    animateToPosition(positionRef.current + 1)
  }, [animateToPosition])

  const finishDrag = useCallback((endX: number) => {
    const drag = dragRef.current
    dragRef.current = null

    if (!drag || drag.axis !== 'x') {
      setTrackDragging(false)
      dragOffsetRef.current = 0
      if (trackRef.current) trackRef.current.style.transition = ''
      applyTransform(0)
      return
    }

    const deltaX = endX - drag.startX
    const width = getWidth()
    const threshold = Math.min(width * 0.15, SWIPE_THRESHOLD_PX)
    const current = positionRef.current

    let nextPosition = current
    if (deltaX <= -threshold) nextPosition = current + 1
    else if (deltaX >= threshold) nextPosition = current - 1

    if (nextPosition === current) {
      animateToOffset(0, () => {
        dragOffsetRef.current = 0
        trackRef.current?.classList.remove('is-snapping')
      })
      return
    }

    const goingNext = nextPosition > current
    const targetOffset = goingNext ? -width : width

    animateToOffset(targetOffset, () => {
      commitPosition(nextPosition)
    })
  }, [animateToOffset, applyTransform, commitPosition, getWidth, setTrackDragging])

  const updateDrag = useCallback((clientX: number, clientY: number) => {
    const drag = dragRef.current
    if (!drag) return

    const deltaX = clientX - drag.startX
    const deltaY = clientY - drag.startY
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (!drag.locked) {
      if (absX < AXIS_LOCK_PX && absY < AXIS_LOCK_PX) return

      if (absY > absX * AXIS_RATIO) {
        dragRef.current = null
        return
      }

      if (absX > absY * AXIS_RATIO) {
        drag.axis = 'x'
        drag.locked = true
        setPaused(true)
        setTrackDragging(true)
        trackRef.current!.style.transition = 'none'
      } else {
        return
      }
    }

    if (drag.axis !== 'x') return

    dragOffsetRef.current = deltaX

    const width = getWidth()
    if (width > 0) {
      if (positionRef.current <= FIRST_POSITION && deltaX > 0) {
        dragOffsetRef.current = Math.min(deltaX, width)
      } else if (positionRef.current >= LAST_POSITION && deltaX < 0) {
        dragOffsetRef.current = Math.max(deltaX, -width)
      }
    }

    applyTransform(dragOffsetRef.current)
  }, [applyTransform, getWidth, setTrackDragging])

  const startDrag = useCallback((clientX: number, clientY: number) => {
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      axis: null,
      locked: false,
    }
  }, [])

  const cancelDrag = useCallback(() => {
    dragRef.current = null
    mouseDragging.current = false
    dragOffsetRef.current = 0
    setTrackDragging(false)
    applyTransform(0)
  }, [applyTransform, setTrackDragging])

  useEffect(() => {
    applyTransform(0)
  }, [applyTransform])

  useEffect(() => {
    const node = sliderRef.current
    if (!node) return

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      startDrag(event.touches[0].clientX, event.touches[0].clientY)
    }

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      updateDrag(event.touches[0].clientX, event.touches[0].clientY)
    }

    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (!touch) {
        cancelDrag()
        return
      }
      finishDrag(touch.clientX)
    }

    node.addEventListener('touchstart', onTouchStart, { passive: true })
    node.addEventListener('touchmove', onTouchMove, { passive: true })
    node.addEventListener('touchend', onTouchEnd, { passive: true })
    node.addEventListener('touchcancel', cancelDrag, { passive: true })

    return () => {
      node.removeEventListener('touchstart', onTouchStart)
      node.removeEventListener('touchmove', onTouchMove)
      node.removeEventListener('touchend', onTouchEnd)
      node.removeEventListener('touchcancel', cancelDrag)
    }
  }, [cancelDrag, finishDrag, startDrag, updateDrag])

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!mouseDragging.current) return
      updateDrag(event.clientX, event.clientY)
    }

    const onMouseUp = (event: MouseEvent) => {
      if (!mouseDragging.current) return
      mouseDragging.current = false
      finishDrag(event.clientX)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [finishDrag, updateDrag])

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    mouseDragging.current = true
    startDrag(event.clientX, event.clientY)
    setPaused(true)
    setTrackDragging(true)
    if (trackRef.current) trackRef.current.style.transition = 'none'
  }, [setTrackDragging, startDrag])

  useEffect(() => {
    if (paused) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const timer = window.setInterval(goNext, INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [goNext, paused])

  return (
    <section
      className="home-hero-banner"
      aria-label="Forsidebanner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (!mouseDragging.current && !dragRef.current) setPaused(false)
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      <h1 className="sr-only">Finn de beste kosttilskuddene</h1>

      <div
        ref={sliderRef}
        className="home-hero-slider"
        onMouseDown={handleMouseDown}
      >
        <div ref={trackRef} className="home-hero-slider-track">
          {loopSlides.map((slide, index) => (
            <div
              key={slide.loopKey}
              className={`home-hero-slide${
                slide.kind === 'image' && slideHasMobile(slide) ? ' home-hero-slide--has-mobile' : ''
              }${slide.kind === 'copy' ? ' home-hero-slide--copy' : ''}`}
              aria-hidden={index !== position}
            >
              {slide.kind === 'copy' ? (
                <>
                  <div className="home-hero-copy-slide" role="img" aria-label={slide.alt}>
                    <div className="home-hero-copy-slide-inner">
                      <p className="home-hero-copy-eyebrow">Deklarasjonsanalyse</p>
                      <h2 className="home-hero-copy-title">{slide.title}</h2>
                      <p className="home-hero-copy-lead">{slide.lead}</p>
                    </div>
                  </div>
                  {copySlideHasMobile(slide) ? (
                    <picture className="home-hero-copy-mobile-only">
                      <img
                        src={slide.mobile}
                        alt="Ingen kan kjøpe seg til toppen — produkter vurderes etter åpne kriterier uten sponsede plasseringer."
                        className="home-hero-banner-img home-hero-banner-img--independent"
                        width={1086}
                        height={1448}
                        decoding="async"
                        draggable={false}
                      />
                    </picture>
                  ) : null}
                </>
              ) : (
                <picture>
                  {slideHasMobile(slide) ? (
                    <source media="(max-width: 767px)" srcSet={slide.mobile} />
                  ) : null}
                  <img
                    src={slide.desktop}
                    alt={slide.alt}
                    className={`home-hero-banner-img home-hero-banner-img--${slide.id}`}
                    width={slide.width}
                    height={slide.height}
                    fetchPriority={slide.id === 'hero' && index === FIRST_POSITION ? 'high' : 'auto'}
                    decoding="async"
                    draggable={false}
                  />
                </picture>
              )}
            </div>
          ))}
        </div>

        <div className="home-hero-slider-controls" role="group" aria-label="Velg banner">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`home-hero-slider-dot${index === active ? ' is-active' : ''}`}
              aria-label={`Vis banner: ${slide.label}`}
              aria-current={index === active ? 'true' : undefined}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
