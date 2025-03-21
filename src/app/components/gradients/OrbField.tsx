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
      'rgba(59, 130, 246, 0.6) 0%',
      'rgba(147, 51, 234, 0.4) 50%',
      'rgba(59, 130, 246, 0.5) 70%'
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
          ? 'rgba(30, 58, 138, 0.7) 0%'  // darker blue
          : 'rgba(147, 51, 234, 0.5) 0%', // purple
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

  // Medium moving orbs configuration
  const mediumOrbs = Array(8).fill(null).map((_, i) => {
    const radius = 450;
    const angle = (i * Math.PI * 2) / 8;
    const points = 24;
    return {
      size: 900,
      blur: 100,
      colors: [
        i % 2 === 0 
          ? 'rgba(96, 165, 250, 0.6) 0%'
          : 'rgba(147, 51, 234, 0.4) 0%',
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

  // Top left orbs configuration
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
        i % 2 === 0 
          ? 'rgba(34, 211, 238, 1) 0%'
          : 'rgba(125, 211, 252, 0.8) 0%',
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

  // Wide spread orbs
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
        i % 2 === 0 
          ? 'rgba(34, 211, 238, 0.7) 0%'
          : 'rgba(125, 211, 252, 0.6) 0%',
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

  // Left side orbs configuration
  const leftSideOrbs = Array(6).fill(null).map((_, i) => {
    const baseX = -400;
    const baseY = 0;
    const radius = 250;
    const angle = (i * Math.PI * 2) / 6;
    const points = 24;
    return {
      size: 600,
      blur: 80,
      colors: [
        i % 2 === 0 
          ? 'rgba(59, 130, 246, 0.8) 0%'
          : 'rgba(147, 51, 234, 0.6) 0%',
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

  // Bottom left orbs configuration
  const bottomLeftOrbs = Array(4).fill(null).map((_, i) => {
    const baseX = -300;
    const baseY = 400;
    const radius = 200;
    const angle = (i * Math.PI * 2) / 4;
    const points = 24;
    return {
      size: 800,
      blur: 90,
      colors: [
        i % 2 === 0 
          ? 'rgba(30, 58, 138, 0.8) 0%'  // darker blue
          : 'rgba(59, 130, 246, 0.7) 0%', // ocean blue
        'transparent 80%'
      ],
      animate: {
        x: Array.from({ length: points }, (_, j) => {
          const t = j / (points - 1);
          return baseX + Math.cos(angle + t * Math.PI * 2) * radius * (1 + Math.sin(t * Math.PI * 4) * 0.3);
        }),
        y: Array.from({ length: points }, (_, j) => {
          const t = j / (points - 1);
          return baseY + Math.sin(angle + t * Math.PI * 2) * radius * (1 + Math.cos(t * Math.PI * 4) * 0.3);
        }),
      },
      duration: 12
    };
  });

  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`}>
      <GradientOrb 
        size={centerOrb.size}
        blur={centerOrb.blur}
        colors={centerOrb.colors}
        animate={centerOrb.animate}
        duration={centerOrb.duration}
      />
      {largeOrbs.map((config, i) => (
        <GradientOrb 
          key={`large-${i}`}
          size={config.size}
          blur={config.blur}
          colors={config.colors}
          animate={config.animate}
          duration={config.duration}
        />
      ))}
      {mediumOrbs.map((config, i) => (
        <GradientOrb 
          key={`medium-${i}`}
          size={config.size}
          blur={config.blur}
          colors={config.colors}
          animate={config.animate}
          duration={config.duration}
        />
      ))}
      {topLeftOrbs.map((config, i) => (
        <GradientOrb 
          key={`top-left-${i}`}
          size={config.size}
          blur={config.blur}
          colors={config.colors}
          animate={config.animate}
          duration={config.duration}
        />
      ))}
      {wideSpreadOrbs.map((config, i) => (
        <GradientOrb 
          key={`wide-spread-${i}`}
          size={config.size}
          blur={config.blur}
          colors={config.colors}
          animate={config.animate}
          duration={config.duration}
        />
      ))}
      {leftSideOrbs.map((config, i) => (
        <GradientOrb 
          key={`left-${i}`}
          size={config.size}
          blur={config.blur}
          colors={config.colors}
          animate={config.animate}
          duration={config.duration}
        />
      ))}
      {bottomLeftOrbs.map((config, i) => (
        <GradientOrb 
          key={`bottom-left-${i}`}
          size={config.size}
          blur={config.blur}
          colors={config.colors}
          animate={config.animate}
          duration={config.duration}
        />
      ))}
    </div>
  );
}; 