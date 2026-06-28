/** Breakpoint values matching tokens.css — for useMediaQuery and JS layout. */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 900,
  xl: 1180,
} as const

export type BreakpointKey = keyof typeof breakpoints
