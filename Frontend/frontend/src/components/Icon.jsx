const paths = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  satellite: <><path d="m5 3 4 4-2 2-4-4 2-2Z" /><path d="m19 21-4-4 2-2 4 4-2 2Z" /><path d="m14 8 2 2-6 6-2-2 6-6Z" /><path d="M7 14a5 5 0 0 1 3 3M4 14a8 8 0 0 1 6 6M17 10a5 5 0 0 0-3-3M20 10a8 8 0 0 0-6-6" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.5 4 5.5 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.5-4-9s1.4-6.5 4-9Z" /></>,
  signal: <><path d="M4 18h2M9 14h2v4H9zM14 10h2v8h-2zM19 6h2v12h-2z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  focus: <><path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M8 21H4a1 1 0 0 1-1-1v-4M16 21h4a1 1 0 0 0 1-1v-4" /><circle cx="12" cy="12" r="3" /></>,
  pause: <><path d="M8 6v12M16 6v12" /></>,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  altitude: <><path d="M12 21V3M7 8l5-5 5 5" /><path d="M5 21h14" /></>,
  speed: <><path d="M4.9 19a9 9 0 1 1 14.2 0" /><path d="m12 13 4-4" /><circle cx="12" cy="13" r="1" /></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
}
export function Icon({ name, size = 18, strokeWidth = 1.7, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    >
      {paths[name]}
    </svg>
  )
}
