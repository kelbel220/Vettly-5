'use client';

import { OrbField } from './components/gradients/OrbField';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import { PulseButton } from './components/buttons/PulseButton';

const inter = Inter({
  subsets: ['latin']
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c5f1ff] via-[#ffebf9] to-[#fff4e4] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <OrbField />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="absolute top-8 left-1/2 -translate-x-1/2">
          {/* Logo */}
          <div>
            <Image
              src="/vettly-logo.png"
              alt="Vettly"
              width={180}
              height={180}
              className="rounded-xl"
              priority
            />
          </div>
        </div>

        <div className="text-center">
          {/* Main Content */}
          <div className="space-y-24">
            {/* Taglines */}
            <div className="space-y-5">
              <h1 className="text-[74px] leading-[1.1] tracking-tight font-light">
                <div className="text-white font-playfair">Matchmaking,</div>
                <div className="bg-gradient-to-r from-[#8ff1ff] to-[#e8a6ff] text-transparent bg-clip-text font-bold font-playfair">
                  Revolutionised
                </div>
              </h1>
              <p className="text-white tracking-[0.25em] text-xs font-light">
                POWERED BY PEOPLE, PERFECTED BY TECH
              </p>
            </div>

            {/* Approval Message */}
            <div className="space-y-8 px-8 md:px-0 max-w-2xl mx-auto">
              <h2 className="font-playfair text-[56px] md:text-[82px] leading-tight md:leading-none text-white font-light mb-8 text-center">
                Congratulations!
              </h2>
              <div className="space-y-12 md:space-y-8">
                <div className="space-y-8 md:space-y-4">
                  <p className={`text-[#34D8F1] text-lg md:text-xl font-light ${inter.className} text-center max-w-lg mx-auto`}>
                    You've been approved to join Vettly.
                  </p>
                  <div>
                    <p className={`text-white/85 text-lg md:text-xl font-light tracking-wider ${inter.className} text-center max-w-xl mx-auto`}>
                      Welcome to the dating revolution, a smarter, more intentional way to date.
                    </p>
                  </div>
                </div>
                <div className="pt-4 md:pt-8 flex justify-center items-center">
                  <PulseButton onClick={() => window.location.href = '/profile'}>
                    Create Profile
                  </PulseButton>
                </div>
              </div>
            </div>

            {/* CTA Button */}
          </div>
        </div>
      </div>
    </div>
  );
}
