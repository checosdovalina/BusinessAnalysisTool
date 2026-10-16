import type { CSSProperties } from "react";

type OtsEnergyLogoProps = {
  /** Render just the recognizable app mark. */
  iconOnly?: boolean;
  /** Alias for iconOnly for callers that prefer an explicit icon variant. */
  compact?: boolean;
  /** Use one solid foreground color for the complete mark. */
  monochrome?: boolean;
  /** Inherit the surrounding foreground color instead of using brand colors. */
  color?: "brand" | "current";
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  subtitle?: string;
  style?: CSSProperties;
  label?: string;
};

/**
 * OTS Energy's three-node path mark: three linked stations form a stepped
 * electrical route, carrying the orange favicon silhouette into a scalable
 * network/training symbol.
 */
export function OtsEnergyLogo({
  iconOnly = false,
  compact = false,
  monochrome = false,
  color = "brand",
  className,
  iconClassName,
  wordmarkClassName,
  subtitle,
  style,
  label = "OTS Energy",
}: OtsEnergyLogoProps) {
  const compactMode = iconOnly || compact;
  const mono = monochrome || color === "current";

  return (
    <span
      className={className}
      style={style}
      role="img"
      aria-label={label}
      data-ots-energy-logo=""
    >
      <svg
        className={iconClassName}
        width="40"
        height="40"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {!mono && (
          <rect
            x="1"
            y="1"
            width="46"
            height="46"
            rx="13"
            fill="var(--ots-logo-tile, #15383B)"
          />
        )}
        {!mono && (
          <path
            d="M8 8h32v32H8z"
            stroke="rgba(255,255,255,.08)"
            strokeWidth="1"
          />
        )}
        <path
          d="M14 13h12a3 3 0 0 1 3 3v4h5a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-5v4a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h12v-3H14a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3Z"
          fill={mono ? "currentColor" : "#F27622"}
        />
        <path
          d="M17 17h7m-7 14h7m5-8h5"
          stroke={mono ? "currentColor" : "#FFC16C"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {!compactMode && (
        <span className={wordmarkClassName} aria-hidden="true">
          <strong>OTS <i>ENERGY</i></strong>
          {subtitle && <small className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.2em] opacity-60">{subtitle}</small>}
        </span>
      )}
    </span>
  );
}

export default OtsEnergyLogo;
