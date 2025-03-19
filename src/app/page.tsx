'use client';

import { OrbField } from './components/gradients/OrbField';
import { AnimatedText } from './components/text/AnimatedText';
import { TypewriterText } from './components/text/TypewriterText';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#000B2A] relative overflow-hidden">
      {/* Main Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6B46C1]/95 via-[#9333EA]/90 to-[#6B46C1]/70" />
      
      {/* Gradient Orbs */}
      <OrbField />

      {/* Logo and Tagline */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
        <div className="w-[150px]">
          <Image
            src="/vettly-logo.png"
            alt="Vettly"
            width={150}
            height={50}
            priority
          />
        </div>
        <div className="mt-2 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent blur-sm" />
          <p className="text-[10px] tracking-[0.2em] text-cyan-300 font-bold uppercase whitespace-nowrap">
            POWERED BY PEOPLE, PERFECTED BY TECH
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col items-center">
        {/* Main Title Section */}
        <div className="text-center pt-52">
          <div className="flex flex-col gap-2">
            <AnimatedText 
              text="WELCOME TO THE" 
              className="text-xl md:text-2xl font-serif italic leading-none relative z-10"
              delay={0.1}
            />
            <AnimatedText 
              text="DATING" 
              className="text-6xl md:text-8xl font-black tracking-wider leading-none relative z-10"
              delay={0.3}
            />
            <AnimatedText 
              text="REVOLUTION" 
              className="text-6xl md:text-8xl font-black tracking-wider leading-none relative z-10"
              delay={0.5}
            />
          </div>
        </div>

        {/* Approval Message Section */}
        <div className="text-center mt-12">
          <TypewriterText 
            text="You've been approved to join Vettly" 
            className="text-2xl md:text-3xl font-serif italic leading-none text-purple-900"
            delay={1.2}
          />
          <div className="relative mt-8">
            <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform scale-x-75" />
            <div className="absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent blur-sm transform scale-x-100" />
            <div className="h-[4px] w-full bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent blur-md transform scale-x-125" />
          </div>
        </div>

        {/* Description and Button Section */}
        <div className="text-center mt-6 max-w-2xl mx-auto px-4">
          <p className="text-lg md:text-xl text-purple-900 font-light leading-relaxed tracking-wide">
            Expert human matchmakers, enhanced by AI, creating a smarter, more efficient way to date.
          </p>
          
          <div className="mt-6">
            <button 
              className="group relative px-10 py-4 bg-gradient-to-r from-[#4169E1] to-[#8A2BE2] rounded-full overflow-hidden"
              onClick={() => window.location.href = '/profile'}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#4169E1] to-[#8A2BE2] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-full group-hover:translate-x-0 transform" />
              <span className="relative text-lg font-semibold text-white">
                Create Profile
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
