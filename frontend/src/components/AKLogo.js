import React from 'react';

/**
 * Custom AK logo — stylized A and K letterforms in SVG.
 * Drop-in replacement for the Zap icon in brand areas.
 */
export default function AKLogo({ size = 20, color = '#ffffff' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Letter A — left half */}
      <path
        d="M1.5 18L6 6L10.5 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.2 14H8.8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Letter K — right half */}
      <path
        d="M13.5 6V18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13.5 12.5L22 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13.5 12.5L22 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
