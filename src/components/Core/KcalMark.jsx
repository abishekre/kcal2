/**
 * Kcal brand mark — a clean geometric flame (calories / metabolic "burn")
 * with an emerald ember core that ties to the app's health accent.
 *
 * The outer flame uses `currentColor`, so inside the black/white rounded-square
 * badge it inherits the badge's text color (white-on-dark, black-on-light).
 * The ember is always emerald for a consistent two-tone identity.
 *
 * Props:
 *  - size: pixel size (default 40)
 *  - badge: when true, renders inside the rounded-square badge used app-wide
 *  - className: extra classes (applied to the root svg or badge wrapper)
 */
const FLAME_OUTER =
  'M25 3 C 26.6 9.4 23.7 13.3 26.2 17.4 C 28.2 20.6 32.9 21.1 35.2 25.8 ' +
  'C 38.2 31.9 35.3 39.2 28.4 41.4 C 21.9 43.4 14.3 40.4 12.3 33.4 ' +
  'C 10.7 27.9 13 23.2 17 20.7 C 16.4 23.9 17.9 25.8 20 26 ' +
  'C 17.9 20.7 20.3 10 25 3 Z';

const FLAME_EMBER =
  'M24.4 22.5 C 25.4 26 28.3 27.1 29.1 30.8 C 29.9 34.8 27.1 37.8 23.4 37.8 ' +
  'C 20 37.8 17.6 35 18.3 31.4 C 18.8 28.8 20.4 27.6 21.3 25.7 ' +
  'C 21.6 27.3 22.5 27.7 23.1 27.5 C 22.4 25.5 22.9 24 24.4 22.5 Z';

export function KcalMark({ size = 40, badge = false, className = '' }) {
  const flame = (
    <svg
      width={badge ? size * 0.52 : size}
      height={badge ? size * 0.52 : size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={badge ? '' : className}
    >
      <path d={FLAME_OUTER} fill="currentColor" />
      <path d={FLAME_EMBER} fill="#10b981" />
    </svg>
  );

  if (!badge) return flame;

  return (
    <div
      className={`bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center ${className}`}
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
    >
      {flame}
    </div>
  );
}

export default KcalMark;
