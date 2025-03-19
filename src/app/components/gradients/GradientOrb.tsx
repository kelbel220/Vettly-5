'use client';

import { motion } from 'framer-motion';

interface GradientOrbProps {
  size: number;
  blur: number;
  colors: string[];
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  animate?: {
    scale?: number[];
    x?: number[];
    y?: number[];
  };
  duration?: number;
  className?: string;
}

export const GradientOrb: React.FC<GradientOrbProps> = ({
  size,
  blur,
  colors,
  position = { top: '50%', left: '50%' },
  animate = { scale: [1, 1.2, 1] },
  duration = 8,
  className = "",
}) => {
  const gradientString = `radial-gradient(circle at center, ${colors.join(', ')})`;

  return (
    <motion.div
      className={`absolute rounded-full filter ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: gradientString,
        filter: `blur(${blur}px)`,
        ...position,
        transform: 'translate(-50%, -50%)',
      }}
      animate={animate}
      transition={{
        duration,
        repeat: Infinity,
        ease: animate.x ? "linear" : "easeInOut",
      }}
    />
  );
}; 