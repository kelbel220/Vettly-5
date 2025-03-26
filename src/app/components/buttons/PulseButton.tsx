import { Inter } from 'next/font/google';
import { ButtonHTMLAttributes } from 'react';

const inter = Inter({ subsets: ['latin'] });

interface PulseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidthMobile?: boolean;
  maxWidth?: string;
  children: React.ReactNode;
}

export const PulseButton: React.FC<PulseButtonProps> = ({
  fullWidthMobile = true,
  maxWidth = "280px",
  className = "",
  children,
  ...props
}) => {
  return (
    <button
      className={`
        bg-[#34D8F1] 
        text-white 
        text-lg 
        ${fullWidthMobile ? 'w-full' : 'w-auto'} 
        md:w-auto 
        px-8 
        md:px-20 
        py-4 
        md:py-3 
        rounded-full 
        hover:opacity-90 
        tracking-wider 
        shadow-xl 
        hover:shadow-2xl 
        flex 
        items-center 
        justify-center 
        whitespace-nowrap 
        animate-subtle-pulse
        ${maxWidth ? `max-w-[${maxWidth}]` : ''}
        ${className}
      `}
      {...props}
    >
      <span className={`${inter.className} font-bold`}>{children}</span>
    </button>
  );
};

export default PulseButton;
