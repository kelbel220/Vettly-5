import React from 'react';
import { motion } from 'framer-motion';
import { GradientOrb } from './GradientOrb';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface OrbFieldProps {
  className?: string;
}

export const HomeOrbField: React.FC<OrbFieldProps> = ({ className = "" }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Background gradient orbs - specifically for the homepage
  const backgroundOrbs = [
    // Large blue/purple background
    {
      size: isMobile ? 2500 : 4500,
      blur: isMobile ? 80 : 120,
      colors: [
        'rgba(79, 70, 229, 0.95) 0%',  // indigo
        'rgba(124, 58, 237, 0.8) 40%', // purple
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
    
    // Yellow orb (bottom right)
    {
      size: isMobile ? 1800 : 3000,
      blur: isMobile ? 80 : 120,
      colors: [
        'rgba(250, 204, 21, 0.8) 0%',  // yellow
        'rgba(250, 204, 21, 0.6) 40%',
        'transparent 70%'
      ],
      position: {
        right: isMobile ? '-5%' : '-10%',
        bottom: isMobile ? '-5%' : '-10%'
      },
      animate: {
        scale: [1, 1.15, 0.95, 1.1, 1],
        x: isMobile ? [0, 25, -20, 15, 0] : [0, 50, -40, 30, 0],
        y: isMobile ? [0, 25, -20, 15, 0] : [0, 50, -40, 30, 0]
      },
      duration: 30
    },
    
    // Cyan orb (top right)
    {
      size: isMobile ? 1500 : 2500,
      blur: isMobile ? 70 : 100,
      colors: [
        'rgba(34, 211, 238, 0.8) 0%',  // cyan
        'rgba(34, 211, 238, 0.6) 40%',
        'transparent 70%'
      ],
      position: {
        right: isMobile ? '5%' : '10%',
        top: isMobile ? '5%' : '10%'
      },
      animate: {
        scale: [1, 1.2, 0.9, 1.1, 1],
        x: isMobile ? [0, -20, 15, -10, 0] : [0, -40, 30, -20, 0],
        y: isMobile ? [0, -20, 15, -10, 0] : [0, -40, 30, -20, 0]
      },
      duration: 25
    }
  ];

  // Dynamic orbs with more movement
  const dynamicOrbs = [
    // Medium cyan orb with movement
    {
      size: isMobile ? 1000 : 1800,
      blur: isMobile ? 50 : 80,
      colors: [
        'rgba(34, 211, 238, 0.7) 0%',  // cyan
        'rgba(34, 211, 238, 0.5) 40%',
        'transparent 70%'
      ],
      position: {
        left: isMobile ? '30%' : '25%',
        top: isMobile ? '20%' : '15%'
      },
      animate: {
        scale: [1, 1.3, 0.8, 1.2, 1],
        x: isMobile ? [0, 40, -30, 20, 0] : [0, 80, -60, 40, 0],
        y: isMobile ? [0, -30, 40, -20, 0] : [0, -60, 80, -40, 0]
      },
      duration: 20
    },
    
    // Medium yellow orb with movement
    {
      size: isMobile ? 1200 : 2000,
      blur: isMobile ? 60 : 90,
      colors: [
        'rgba(250, 204, 21, 0.7) 0%',  // yellow
        'rgba(250, 204, 21, 0.5) 40%',
        'transparent 70%'
      ],
      position: {
        right: isMobile ? '30%' : '25%',
        bottom: isMobile ? '20%' : '15%'
      },
      animate: {
        scale: [1, 1.3, 0.8, 1.2, 1],
        x: isMobile ? [0, -40, 30, -20, 0] : [0, -80, 60, -40, 0],
        y: isMobile ? [0, 30, -40, 20, 0] : [0, 60, -80, 40, 0]
      },
      duration: 22
    },
    
    // Small blue orb with fast movement
    {
      size: isMobile ? 800 : 1400,
      blur: isMobile ? 40 : 70,
      colors: [
        'rgba(59, 130, 246, 0.7) 0%',  // blue
        'rgba(59, 130, 246, 0.5) 40%',
        'transparent 70%'
      ],
      position: {
        left: isMobile ? '60%' : '55%',
        bottom: isMobile ? '30%' : '25%'
      },
      animate: {
        scale: [1, 1.4, 0.7, 1.3, 1],
        x: isMobile ? [0, 50, -40, 30, 0] : [0, 100, -80, 60, 0],
        y: isMobile ? [0, 40, -50, 30, 0] : [0, 80, -100, 60, 0]
      },
      duration: 18
    }
  ];

  return (
    <div className={`fixed inset-0 overflow-visible pointer-events-none ${className}`}>
      {/* Background gradient orbs */}
      {backgroundOrbs.map((orb, i) => (
        <GradientOrb key={`background-${i}`} {...orb} />
      ))}

      {/* Dynamic orbs */}
      {dynamicOrbs.map((orb, i) => (
        <GradientOrb key={`dynamic-${i}`} {...orb} />
      ))}
    </div>
  );
};
