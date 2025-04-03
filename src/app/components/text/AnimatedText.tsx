'use client';

import { motion } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  shimmer?: boolean;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({ 
  text, 
  className = "", 
  delay = 0,
  shimmer = false 
}) => {
  const words = text.split(' ');
  
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const wordVariants = {
    initial: { 
      opacity: 0,
      y: 20,
    },
    animate: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
      },
    },
  };

  return (
    <motion.div
      className={`${className} relative`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div
        className={shimmer ? 'animate-pulse-subtle' : ''}
      >
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            variants={wordVariants}
            className="inline-block"
            style={{ marginRight: i === words.length - 1 ? 0 : '0.3em' }}
          >
            {word}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
};