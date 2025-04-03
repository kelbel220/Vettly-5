'use client';

import { GradientOrb } from './GradientOrb';

interface OrbFieldProps {
  className?: string;
}

export const OrbField: React.FC<OrbFieldProps> = ({ className = "" }) => {
  // Center large orb configuration
  const centerOrb = {
    size: 2000,
    blur: 150,
    colors: [
      'rgba(0, 240, 255, 1) 0%',       // Very bright cyan
      'rgba(147, 51, 234, 0.7) 50%',   // Vibrant purple
      'rgba(0, 240, 255, 1) 70%'       // Very bright cyan
    ],
    animate: { 
      scale: [1, 1.3, 1],
      rotate: [0, 180, 360]
    },
    duration: 8
  };

  // Large moving orbs configuration
  const largeOrbs = Array(4).fill(null).map((_, i) => {
    const radius = 600;
    const angle = (i * Math.PI * 2) / 4;
    const points = 24; // More points for smoother movement
    return {
      size: 1200,
      blur: 120,
      colors: [
        i % 2 === 0 
          ? 'rgba(0, 240, 255, 1) 0%'         // Very bright cyan
          : 'rgba(0, 80, 200, 1) 0%',         // Rich dark blue
        'transparent 80%'
      ],
      animate: {
        x: Array.from({ length: points }, (_, j) => {
          const t = j / (points - 1);
          return Math.cos(angle + t * Math.PI * 2) * radius * (1 + Math.sin(t * Math.PI * 4) * 0.3);
        }),
        y: Array.from({ length: points }, (_, j) => {
          const t = j / (points - 1);
          return Math.sin(angle + t * Math.PI * 2) * radius * (1 + Math.cos(t * Math.PI * 4) * 0.3);
        }),
      },
      duration: 20
    };
  });

  // Medium moving orbs configuration - cyan and blue
  const mediumOrbs = Array(8).fill(null).map((_, i) => {
    const radius = 450;
    const angle = (i * Math.PI * 2) / 8;
    const points = 24;
    return {
      size: 900,
      blur: 100,
      colors: [
        i % 3 === 0 || i % 3 === 1
          ? 'rgba(0, 240, 255, 1) 0%'         // Very bright cyan (67% of orbs)
          : 'rgba(0, 80, 200, 1) 0%',         // Rich dark blue (33% of orbs)
        'transparent 75%'
      ],
      animate: {
        x: Array.from({ length: points }, (_, j) => {
          const t = j / (points - 1);
          return Math.cos(angle + t * Math.PI * 2) * radius * (1 + Math.sin(t * Math.PI * 6) * 0.35);
        }),
        y: Array.from({ length: points }, (_, j) => {
          const t = j / (points - 1);
          return Math.sin(angle + t * Math.PI * 2) * radius * (1 + Math.cos(t * Math.PI * 6) * 0.35);
        }),
      },
      duration: 18
    };
  });

  // Top left orbs configuration - all cyan
  const topLeftOrbs = Array(4).fill(null).map((_, i) => {
    const baseX = -300;
    const baseY = -200;
    const radius = 300;
    const angle = (i * Math.PI * 2) / 4;
    const points = 24;
    return {
      size: 500,
      blur: 60,
      colors: [
        'rgba(0, 240, 255, 1) 0%',         // Very bright cyan (100% of orbs)
        'transparent 80%'
      ],
      animate: {
        x: Array.from({ length: points }, (_, j) => {
          const t = j / (points - 1);
          return baseX + Math.cos(angle + t * Math.PI * 2) * radius * (1 + Math.sin(t * Math.PI * 4) * 0.4);
        }),
        y: Array.from({ length: points }, (_, j) => {
          const t = j / (points - 1);
          return baseY + Math.sin(angle + t * Math.PI * 2) * radius * (1 + Math.cos(t * Math.PI * 4) * 0.4);
        }),
      },
      duration: 15
    };
  });

  // Wide spread orbs - cyan and blue
  const wideSpreadOrbs = Array(8).fill(null).map((_, i) => {
    const baseX = -350;
    const baseY = -100;
    const radius = 350;
    const angle = (i * Math.PI * 2) / 8;
    const points = 24;
    return {
      size: 800,
      blur: 90,
      colors: [
        i % 4 <= 2
          ? 'rgba(0, 240, 255, 1) 0%'         // Very bright cyan (75% of orbs)
          : 'rgba(0, 80, 200, 1) 0%',         // Rich dark blue (25% of orbs)
        'transparent 80%'
      ],
      animate: {
        x: Array.from({ length: points }, (_, j) => {
          const t = j / (points - 1);
          return baseX + Math.cos(angle + t * Math.PI * 2) * radius * (1 + Math.sin(t * Math.PI * 6) * 0.45);
        }),
        y: Array.from({ length: points }, (_, j) => {
          const t = j / (points - 1);
          return baseY + Math.sin(angle + t * Math.PI * 2) * radius * (1 + Math.cos(t * Math.PI * 6) * 0.45);
        }),
      },
      duration: 22
    };
  });

  // Additional accent orbs - only blue
  const accentOrbs = [
    // Large rich blue orb in top right
    {
      size: 1600,
      blur: 110,
      colors: [
        'rgba(0, 80, 200, 1) 0%',      // Rich dark blue
        'transparent 80%'
      ],
      position: {
        right: '10%',
        top: '15%'
      },
      animate: { 
        scale: [1, 1.15, 0.95, 1.1, 1],
      },
      duration: 20
    },
    // Extra large cyan orb in bottom right
    {
      size: 1800,
      blur: 120,
      colors: [
        'rgba(0, 240, 255, 1) 0%',     // Very bright cyan
        'transparent 80%'
      ],
      position: {
        right: '5%',
        bottom: '10%'
      },
      animate: { 
        scale: [1, 1.2, 0.9, 1.1, 1],
      },
      duration: 25
    }
  ];

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Center Orb */}
      <GradientOrb {...centerOrb} />

      {/* Large Moving Orbs */}
      {largeOrbs.map((orb, i) => (
        <GradientOrb key={`large-orb-${i}`} {...orb} />
      ))}

      {/* Medium Moving Orbs */}
      {mediumOrbs.map((orb, i) => (
        <GradientOrb key={`medium-orb-${i}`} {...orb} />
      ))}

      {/* Top Left Orbs */}
      {topLeftOrbs.map((orb, i) => (
        <GradientOrb key={`top-left-orb-${i}`} {...orb} />
      ))}

      {/* Wide Spread Orbs */}
      {wideSpreadOrbs.map((orb, i) => (
        <GradientOrb key={`wide-spread-orb-${i}`} {...orb} />
      ))}

      {/* Accent Orbs */}
      {accentOrbs.map((orb, i) => (
        <GradientOrb key={`accent-orb-${i}`} {...orb} />
      ))}
    </div>
  );
};