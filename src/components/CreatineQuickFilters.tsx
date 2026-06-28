const shortcuts = [
  { label: 'Best score', path: '/tester/kreatin/' },
  { label: 'Best verdi', path: '/tester/kreatin/?preset=value' },
  { label: 'Best budsjett', path: '/tester/kreatin/billigste/' },
  { label: 'Creapure', path: '/tester/kreatin/creapure/' },
  { label: 'Best dokumentert', path: '/tester/kreatin/?doping=1&purity=1' },
  { label: 'Monohydrat', path: '/tester/kreatin/?mono=1' },
  { label: 'Merkevare-råvare', path: '/tester/kreatin/?raw=branded' },
] as const

export default function CreatineQuickFilters({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <nav className="quick-filter-bar" aria-label="Snarveier kreatin">
      {shortcuts.map((item) => (
        <button key={item.path + item.label} type="button" className="quick-filter-chip" onClick={() => onNavigate(item.path)}>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
