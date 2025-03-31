import React from 'react';
import { motion } from 'framer-motion';
import { GradientOrb } from './GradientOrb';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface OrbFieldProps {
  className?: string;
}

export const QuestionnaireOrbField: React.FC<OrbFieldProps> = ({ className = "" }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Background gradient orbs - keeping the original ones
  const backgroundOrbs = [
    // Massive cyan background - keeping this from the original
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
    
    // Small dark purple orb in top-right corner
    {
      size: isMobile ? 300 : 500,
      blur: isMobile ? 40 : 60,
      colors: [
        'rgba(88, 28, 135, 0.9) 0%',
        'rgba(88, 28, 135, 0.7) 40%',
        'rgba(88, 28, 135, 0) 80%'
      ],
      position: {
        right: '5%',
        top: '5%'
      },
      animate: {
        scale: [1, 1.2, 0.9, 1.1, 1],
        x: isMobile ? [0, 10, -8, 5, 0] : [0, 20, -15, 10, 0],
        y: isMobile ? [0, -8, 10, -5, 0] : [0, -15, 20, -10, 0]
      },
      duration: 20
    },
    
    // Small dark purple orb in bottom-left corner
    {
      size: isMobile ? 300 : 500,
      blur: isMobile ? 40 : 60,
      colors: [
        'rgba(88, 28, 135, 0.9) 0%',
        'rgba(88, 28, 135, 0.7) 40%',
        'rgba(88, 28, 135, 0) 80%'
      ],
      position: {
        left: '5%',
        bottom: '5%'
      },
      animate: {
        scale: [1, 1.2, 0.9, 1.1, 1],
        x: isMobile ? [0, 10, -8, 5, 0] : [0, 20, -15, 10, 0],
        y: isMobile ? [0, 8, -10, 5, 0] : [0, 15, -20, 10, 0]
      },
      duration: 18
    },
    
    // Small dark purple orb in bottom-right corner
    {
      size: isMobile ? 300 : 500,
      blur: isMobile ? 40 : 60,
      colors: [
        'rgba(88, 28, 135, 0.9) 0%',
        'rgba(88, 28, 135, 0.7) 40%',
        'rgba(88, 28, 135, 0) 80%'
      ],
      position: {
        right: '5%',
        bottom: '5%'
      },
      animate: {
        scale: [1, 1.2, 0.9, 1.1, 1],
        x: isMobile ? [0, -10, 8, -5, 0] : [0, -20, 15, -10, 0],
        y: isMobile ? [0, 8, -10, 5, 0] : [0, 15, -20, 10, 0]
      },
      duration: 22
    },
    
    // Small dark purple orb in top-left corner
    {
      size: isMobile ? 300 : 500,
      blur: isMobile ? 40 : 60,
      colors: [
        'rgba(88, 28, 135, 0.9) 0%',
        'rgba(88, 28, 135, 0.7) 40%',
        'rgba(88, 28, 135, 0) 80%'
      ],
      position: {
        left: '5%',
        top: '5%'
      },
      animate: {
        scale: [1, 1.2, 0.9, 1.1, 1],
        x: isMobile ? [0, -10, 8, -5, 0] : [0, -20, 15, -10, 0],
        y: isMobile ? [0, -8, 10, -5, 0] : [0, -15, 20, -10, 0]
      },
      duration: 25
    },
    
    // Large cyan-to-purple transition layers - keeping these from the original
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
      duration: 30 + i * 5
    }))
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {backgroundOrbs.map((orb, i) => (
        <GradientOrb key={i} {...orb} />
      ))}
    </div>
  );
};
