const shortcuts = [
  { label: 'Best formel totalt', path: '/tester/pwo/' },
  { label: 'Best verdi', path: '/tester/pwo/verdi/' },
  { label: 'Best uten koffein', path: '/tester/pwo/stim-free/' },
  { label: 'Laveste pris per dose', path: '/tester/pwo/billigste/' },
  { label: 'Best for nybegynnere', path: '/tester/pwo/nybegynner/' },
  { label: 'Best for pump', path: '/tester/pwo/sterkeste/' },
  { label: 'Lav koffeintoleranse', path: '/tester/pwo/stim-free/' },
] as const

export default function PwoQuickFilters({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <nav className="quick-filter-bar" aria-label="Snarveier">
      {shortcuts.map((item) => (
        <button key={item.path + item.label} type="button" className="quick-filter-chip" onClick={() => onNavigate(item.path)}>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
