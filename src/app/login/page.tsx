'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { OrbField } from '../components/gradients/OrbField';
import { inter, playfair } from '../fonts';

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleLogin = async () => {
    // TODO: Implement Firebase authentication later
    console.log('Google login clicked');
  };

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-cyan-400 to-purple-400 ${inter.className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0">
        <OrbField />
      </div>

      {/* Logo */}
      <div className="relative z-10 -mt-20 mb-16 text-center">
        <Image
          src="/vettly-logo.png"
          alt="Vettly Logo"
          width={200}
          height={67}
          priority
          className="drop-shadow-lg"
        />
      </div>

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Login Card */}
        <div className="w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-white/20">
          {/* Login Header */}
          <h1 className={`text-4xl font-bold text-white text-center mb-12 ${playfair.className}`}>LOGIN</h1>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full h-12 bg-white/10 rounded-full px-6 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/30"
                  placeholder="USERNAME"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-12 bg-white/10 rounded-full px-6 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/30"
                  placeholder="PASSWORD"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full h-12 bg-white/20 backdrop-blur-sm text-white rounded-full font-medium hover:bg-white/30 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/30"
            >
              LOGIN
            </button>

            {/* OR Divider */}
            <div className="relative flex flex-col items-center justify-center mt-6">
              <div className="w-full border-t border-white/30 mb-4"></div>
              <span className="text-white/60 text-sm">OR</span>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white/20 backdrop-blur-sm text-white rounded-full font-medium hover:bg-white/30 transition-all duration-300 flex items-center justify-center space-x-3 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/30"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>LOGIN WITH GOOGLE</span>
            </button>

            {/* Don't have an account text */}
            <p className="text-center text-white/60 text-sm mt-6">
              Don't have an account? <a href="#" className="text-white hover:underline">Apply to join Vettly</a>
            </p>
          </form>
        </div>

        {/* Lock Icon */}
        <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
