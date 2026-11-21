/** Thin line icons (design.md: outline, ~1.5px stroke). currentColor so they follow the text color. */
const PATHS = {
  back: "M15 5l-7 7 7 7",
  home: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z",
  key: "M14 10a4 4 0 1 0-3.5 3.97V20h2.5v-2h2v-2h-2v-2.03A4 4 0 0 0 14 10zM10 9h.01",
  tag: "M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01",
  chart: "M4 19h16M6 16l4-5 3 3 5-7",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  news: "M5 5h11v14H5zM16 9h3v8a2 2 0 0 1-2 2M8 9h5M8 12h5M8 15h3",
  phone: "M6 3h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z",
  chevron: "M9 5l7 7-7 7",
  passport: "M6 3h12v18H6zM12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM9 17h6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
