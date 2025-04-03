'use client';

import { OrbField } from './components/gradients/OrbField';
import { AnimatedText } from './components/text/AnimatedText';
import { TypewriterText } from './components/text/TypewriterText';
import Image from 'next/image';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  return (
    <main className="min-h-screen bg-[#000B2A] relative overflow-hidden">
      {/* Main Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6B46C1]/95 via-[#9333EA]/90 to-[#6B46C1]/70" />
      
      {/* Gradient Orbs */}
      <OrbField />

      {/* Logo and Tagline */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center">
        <div className="w-[150px]">
          <Image
            src="/vettly-logo.png"
            alt="Vettly"
            width={150}
            height={50}
            priority
          />
        </div>
        <div className="mt-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent blur-sm" />
          <p className="text-[10px] tracking-[0.2em] text-[#73FFF6] font-bold uppercase whitespace-nowrap text-center">
            POWERED BY PEOPLE, PERFECTED BY TECH
          </p>
        </div>
      </div>

      {/* Dating Revolution - Centered Absolutely */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
        <div className="flex flex-col gap-2">
          <AnimatedText 
            text="WELCOME TO THE" 
            className="text-xl md:text-2xl font-serif italic leading-none relative z-10"
            delay={0.1}
          />
          <AnimatedText 
            text="DATING" 
            className="text-7xl md:text-8xl font-black tracking-wider leading-none relative z-10"
            delay={0.3}
          />
          <AnimatedText 
            text="REVOLUTION" 
            className="text-7xl md:text-8xl font-black tracking-wider leading-none relative z-10"
            delay={0.5}
          />
        </div>
        
        {/* Approval Message Section - Moved closer */}
        <div className="text-center mt-8">
          <TypewriterText 
            text="You've been approved to join Vettly." 
            className="text-xl md:text-2xl font-serif italic leading-none text-[#8A2BE2]"
            delay={1.2}
          />
          <div className="relative mt-4">
            <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform scale-x-75" />
            <div className="absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent blur-sm transform scale-x-100" />
            <div className="h-[4px] w-full bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent blur-md transform scale-x-125" />
          </div>
        </div>
        
        {/* Description moved up */}
        <div className="text-center mt-8 max-w-2xl mx-auto">
          <p className={`${inter.className} text-white text-lg md:text-xl font-light leading-relaxed tracking-wide`}>
            Expert human matchmakers, enhanced by AI, creating a smarter, more efficient way to date.
          </p>
          {/* Button moved up */}
          <div className="mt-10">
            <button 
              className="group relative px-12 md:px-12 py-4 w-[55%] md:w-auto bg-[#8A2BE2] rounded-full overflow-hidden"
              onClick={() => window.location.href = '/signup'}
            >
              <span className={`${inter.className} relative text-lg font-bold text-white`}>
                Create Profile
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
