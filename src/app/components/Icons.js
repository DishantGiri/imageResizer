'use client';

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '1em',
  height: '1em',
};

export const UploadIcon = () => (
  <svg {...svgProps}>
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

export const LinkIcon = () => (
  <svg {...svgProps}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

export const ImageIcon = () => (
  <svg {...svgProps}>
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

export const DownloadIcon = () => (
  <svg {...svgProps}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export const CheckIcon = () => (
  <svg {...svgProps} strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export const AlertIcon = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export const ChevronIcon = () => (
  <svg {...svgProps} strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export const ZapIcon = () => (
  <svg {...svgProps}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

export const LayersIcon = () => (
  <svg {...svgProps}>
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
);

export const RefreshIcon = () => (
  <svg {...svgProps}>
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

export const StarIcon = () => (
  <svg {...svgProps}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export const WandIcon = () => (
  <svg {...svgProps}>
    <path d="M2.7 15.3l11-11a2.1 2.1 0 0 1 3 0l1.6 1.6a2.1 2.1 0 0 1 0 3l-11 11a2.1 2.1 0 0 1-3 0l-1.6-1.6a2.1 2.1 0 0 1 0-3z"/>
    <path d="M19 3l2 2"/><path d="M22 6l-2-2"/><path d="M2 20l4-4"/>
  </svg>
);

export const ScissorsIcon = () => (
  <svg {...svgProps}>
    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88"/>
    <line x1="14.47" y1="14.48" x2="20" y2="20"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
  </svg>
);

export const SparkleIcon = () => (
  <svg {...svgProps}>
    <path d="M12 2l2.4 7.6H22l-6.4 4.6 2.4 7.6L12 17.2 5.9 21.8l2.4-7.6L2 9.6h7.6L12 2z"/>
  </svg>
);

export const PackageIcon = () => (
  <svg {...svgProps}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
