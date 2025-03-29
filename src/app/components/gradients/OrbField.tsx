import React from 'react';
import { motion } from 'framer-motion';
import { GradientOrb } from './GradientOrb';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface OrbFieldProps {
  className?: string;
}

export const OrbField: React.FC<OrbFieldProps> = ({ className = "" }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Background gradient orbs
  const backgroundOrbs = [
    // Massive cyan background
    {
      size: isMobile ? 2500 : 4500,
      blur: isMobile ? 80 : 120,
      colors: [
        'rgba(34, 211, 238, 0.95) 0%',
        'rgba(34, 211, 238, 0.8) 40%',
        'transparent 75%'
      ],
      position: {
        left: isMobile ? '-15%' : '-30%',
        top: isMobile ? '-15%' : '-30%'
      },
      animate: {
        scale: [1, 1.2, 0.9, 1.1, 1],
        x: isMobile ? [0, 30, -20, 15, 0] : [0, 60, -40, 30, 0],
        y: isMobile ? [0, -20, 30, -15, 0] : [0, -40, 60, -30, 0]
      },
      duration: 35
    },
    // Large cyan-to-purple transition layers
    ...Array(3).fill(null).map((_, i) => ({
      size: isMobile ? (2200 - (i * 200)) : (4000 - (i * 300)),
      blur: isMobile ? 70 : 100,
      colors: [
        'rgba(34, 211, 238, 0.9) 0%',
        'rgba(99, 102, 241, 0.8) 50%',
        'rgba(147, 51, 234, 0.7) 100%'
      ],
      position: {
        left: `${isMobile ? (-15 + (i * 10)) : (-25 + (i * 15))}%`,
        top: `${isMobile ? (-15 + (i * 10)) : (-25 + (i * 15))}%`
      },
      animate: {
        scale: [1, 1.15, 0.95, 1.1, 1],
        x: [0, 25 - (i * 5), -18 + (i * 4), 13 - (i * 3), 0],
        y: [0, -18 + (i * 4), 25 - (i * 5), -13 + (i * 3), 0]
      },
      duration: 40 - (i * 3)
    }))
  ];

  // Dynamic cyan orbs with dramatic movement
  const dynamicCyanOrbs = [
    // Large swirling orbs (fewer on mobile)
    ...Array(isMobile ? 3 : 6).fill(null).map((_, i) => ({
      size: isMobile ? (1400 - (i * 150)) : (2800 - (i * 200)),
      blur: isMobile ? 40 : 60,
      colors: [
        'rgba(34, 211, 238, 0.9) 0%',
        'rgba(34, 211, 238, 0.7) 40%',
        'transparent 70%'
      ],
      position: {
        left: `${isMobile ? (-10 + (i * 10)) : (-20 + (i * 15))}%`,
        top: `${isMobile ? (-10 + (i * 10)) : (-20 + (i * 15))}%`
      },
      animate: {
        scale: [1, 1.4, 0.7, 1.3, 1],
        x: isMobile ? [0, 75, -60, 40, 0] : [0, 150, -120, 80, 0],
        y: isMobile ? [0, -60, 75, -40, 0] : [0, -120, 150, -80, 0],
        rotate: [0, 90, -60, 120, 0]
      },
      duration: 20 - (i * 1.5)
    })),
    // Medium fast-moving orbs (fewer on mobile)
    ...Array(isMobile ? 4 : 8).fill(null).map((_, i) => ({
      size: isMobile ? (900 - (i * 100)) : (1800 - (i * 150)),
      blur: isMobile ? 30 : 40,
      colors: [
        'rgba(34, 211, 238, 0.85) 0%',
        'rgba(34, 211, 238, 0.65) 40%',
        'transparent 65%'
      ],
      position: {
        left: `${isMobile ? (10 + (i * 8)) : (0 + (i * 12))}%`,
        top: `${isMobile ? (10 + (i * 8)) : (0 + (i * 12))}%`
      },
      animate: {
        scale: [1, 1.5, 0.6, 1.4, 1],
        x: isMobile ? [0, 50 + (i * 10), -40 - (i * 8), 25 + (i * 5), 0] : [0, 100 + (i * 20), -80 - (i * 15), 50 + (i * 10), 0],
        y: isMobile ? [0, -40 - (i * 8), 50 + (i * 10), -25 + (i * 5), 0] : [0, -80 - (i * 15), 100 + (i * 20), -50 + (i * 10), 0],
        rotate: [0, 180, -120, 240, 0]
      },
      duration: 15 - (i * 1)
    })),
    // Small ultra-fast orbs (fewer on mobile)
    ...Array(isMobile ? 5 : 10).fill(null).map((_, i) => ({
      size: isMobile ? (500 - (i * 40)) : (1000 - (i * 80)),
      blur: isMobile ? 20 : 30,
      colors: [
        'rgba(34, 211, 238, 0.8) 0%',
        'rgba(34, 211, 238, 0.6) 40%',
        'transparent 60%'
      ],
      position: {
        left: `${isMobile ? (30 + (i * 6)) : (20 + (i * 10))}%`,
        top: `${isMobile ? (30 + (i * 6)) : (20 + (i * 10))}%`
      },
      animate: {
        scale: [1, 1.6, 0.5, 1.5, 1],
        x: isMobile ? [0, 30 + (i * 8), -23 - (i * 6), 15 + (i * 4), 0] : [0, 60 + (i * 15), -45 - (i * 12), 30 + (i * 8), 0],
        y: isMobile ? [0, -23 - (i * 6), 30 + (i * 8), -15 + (i * 4), 0] : [0, -45 - (i * 12), 60 + (i * 15), -30 + (i * 8), 0],
        rotate: [0, 270, -180, 360, 0]
      },
      duration: 10 - (i * 0.5)
    }))
  ];

  // Accent orbs (fewer and smaller on mobile)
  const accentOrbs = [
    // Cyan accent
    {
      size: isMobile ? 1200 : 2500,
      blur: isMobile ? 60 : 100,
      colors: [
        'rgba(34, 211, 238, 0.6) 0%',
        'transparent 70%'
      ],
      position: {
        left: isMobile ? '-10%' : '-20%',
        top: isMobile ? '-10%' : '-20%'
      },
      animate: {
        scale: [1, 1.2, 0.9, 1.1, 1],
        x: isMobile ? [0, 25, -18, 13, 0] : [0, 50, -35, 25, 0],
        y: isMobile ? [0, -18, 25, -13, 0] : [0, -35, 50, -25, 0]
      },
      duration: 40
    },
    // Blue accent
    {
      size: isMobile ? 1500 : 3000,
      blur: isMobile ? 70 : 120,
      colors: [
        'rgba(59, 130, 246, 0.5) 0%',
        'transparent 75%'
      ],
      position: {
        left: isMobile ? '10%' : '20%',
        top: '0%'
      },
      animate: {
        scale: [1, 1.15, 0.92, 1.08, 1],
        x: isMobile ? [0, 20, -15, 10, 0] : [0, 40, -30, 20, 0],
        y: isMobile ? [0, -15, 20, -10, 0] : [0, -30, 40, -20, 0]
      },
      duration: 45
    }
  ];

  return (
    <div className={`fixed inset-0 overflow-visible pointer-events-none ${className}`}>
      {/* Background gradient orbs */}
      {backgroundOrbs.map((orb, i) => (
        <GradientOrb key={`background-${i}`} {...orb} />
      ))}

      {/* Dynamic cyan orbs */}
      {dynamicCyanOrbs.map((orb, i) => (
        <GradientOrb key={`dynamic-${i}`} {...orb} />
      ))}

      {/* Subtle movement accents */}
      {accentOrbs.map((orb, i) => (
        <GradientOrb key={`accent-${i}`} {...orb} />
      ))}
    </div>
  );
};