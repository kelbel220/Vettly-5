'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { inter, playfair } from '@/app/fonts';
import { OrbField } from '@/app/components/gradients/OrbField';

interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex: string;
  maritalStatus: string;
  hasChildren: boolean;
  numberOfChildren?: number;
  childrenAges?: string;
  suburb: string;
  state: string;
  educationLevel: string;
  incomeLevel: string;
}

const educationLevels = [
  'High School',
  'Certificate III/IV',
  'Diploma',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'PhD',
  'Other'
];

const incomeLevels = [
  'Under $70,000',
  '$70,000 - $100,000',
  '$100,000 - $150,000',
  '$150,000 - $300,000',
  '$300,000+'
];

const australianStates = [
  'ACT',
  'NSW',
  'NT',
  'QLD',
  'SA',
  'TAS',
  'VIC',
  'WA'
];

const maritalStatusOptions = [
  'Never Married',
  'Separated',
  'Divorced',
  'Widowed'
];

export default function SignupPage() {
  const { signup, signupWithGoogle, currentUser, auth } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupMethod, setSignupMethod] = useState<'email' | 'google' | null>(null);
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dob: '',
    sex: '',
    maritalStatus: '',
    hasChildren: false,
    suburb: '',
    state: '',
    educationLevel: '',
    incomeLevel: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase auth is not initialized');
      }

      // Validate all required fields
      const requiredFields = ['firstName', 'lastName', 'dob', 'sex', 'maritalStatus', 'suburb', 'state', 'educationLevel', 'incomeLevel'] as const;
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Additional validation for email signup
      if (signupMethod === 'email') {
        if (!formData.email || !formData.password) {
          setError('Email and password are required');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
      }

      if (signupMethod === 'email') {
        await signup(formData);
      } else if (signupMethod === 'google') {
        await signupWithGoogle();
        if (currentUser) {
          await setDoc(doc(db, 'users', currentUser.uid), {
            ...formData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      router.push('/profile/images');
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full h-12 bg-white/10 rounded-full px-6 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/30";
  const selectClasses = "w-full h-12 bg-white/10 rounded-full px-6 text-white focus:outline-none appearance-none cursor-pointer border border-white/30";
  const selectContainerClasses = "relative";
  const selectIconClasses = "absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/70";
  const labelClasses = "block text-sm font-medium text-white/80 mb-1 ml-4";

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-white via-blue-400 to-white ${inter.className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0">
        <OrbField />
      </div>

      {/* Logo */}
      <div className="relative z-10 w-full flex justify-center px-6 mb-8">
        <div className="w-[160px] sm:w-[200px]">
          <Image
            src="/vettly-logo.png"
            alt="Vettly Logo"
            width={200}
            height={67}
            priority
            className="drop-shadow-lg"
          />
        </div>
      </div>

      {/* Signup Card Container */}
      <div className="relative z-10 w-full max-w-5xl px-8 sm:px-8 mb-12 mt-8">
        {/* Signup Card */}
        <div className="relative w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-8 shadow-lg border border-white/30">
          {/* User Icon */}
          <div className="absolute -top-12 -right-12">
            <div className="w-24 h-24 bg-[#7badee]/95 rounded-full flex items-center justify-center border border-white/30">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          {/* Authentication Method Selection */}
          {!signupMethod && (
            <div className="flex flex-col space-y-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setSignupMethod('google')}
                className="w-full h-12 bg-white/10 backdrop-blur-sm text-white rounded-full font-medium hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-3 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/30"
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
                <span>Continue with Google</span>
              </button>

              {/* OR Divider */}
              <div className="flex flex-col items-center space-y-3">
                <div className="px-6 text-white/60 text-sm bg-white/10 rounded-full py-1.5">
                  OR
                </div>
                <div className="w-full border-t border-white/30"></div>
              </div>

              <button
                type="button"
                onClick={() => setSignupMethod('email')}
                className="w-full h-12 bg-white/10 backdrop-blur-sm text-white rounded-full font-medium hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-3 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/30"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="ml-2">Continue with Email</span>
              </button>
            </div>
          )}

          {/* Signup Form */}
          {signupMethod && (
            <form onSubmit={handleSubmit} className="mt-8">
              {error && (
                <div className="mb-4 text-red-500 bg-red-100/10 p-4 rounded-lg text-center">
                  {error}
                </div>
              )}
              {signupMethod === 'email' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="email" className={labelClasses}>Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClasses}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className={labelClasses}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={inputClasses}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className={labelClasses}>Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={inputClasses}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className={labelClasses}>First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={inputClasses}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelClasses}>Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={inputClasses}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="dob" className={labelClasses}>Date of Birth</label>
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label htmlFor="sex" className={labelClasses}>Sex</label>
                    <div className={selectContainerClasses}>
                      <select
                        id="sex"
                        name="sex"
                        value={formData.sex}
                        onChange={handleChange}
                        className={selectClasses}
                      >
                        <option value="" className="bg-blue-400/80 text-white">Select sex</option>
                        <option value="male" className="bg-blue-400/80 text-white">Male</option>
                        <option value="female" className="bg-blue-400/80 text-white">Female</option>
                      </select>
                      <div className={selectIconClasses}>▼</div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="maritalStatus" className={labelClasses}>Marital Status</label>
                    <div className={selectContainerClasses}>
                      <select
                        id="maritalStatus"
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleChange}
                        className={selectClasses}
                      >
                        <option value="" className="bg-blue-400/80 text-white">Select marital status</option>
                        {maritalStatusOptions.map(status => (
                          <option key={status} value={status} className="bg-blue-400/80 text-white">{status}</option>
                        ))}
                      </select>
                      <div className={selectIconClasses}>▼</div>
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Do you have children?</label>
                    <div className="flex items-center space-x-4 h-12 bg-white/10 rounded-full px-6 border border-white/30">
                      <label className="flex items-center space-x-2 text-white cursor-pointer">
                        <input
                          type="radio"
                          name="hasChildren"
                          checked={formData.hasChildren}
                          onChange={(e) => setFormData(prev => ({ ...prev, hasChildren: true }))}
                          className="custom-radio"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center space-x-2 text-white cursor-pointer">
                        <input
                          type="radio"
                          name="hasChildren"
                          checked={!formData.hasChildren}
                          onChange={(e) => setFormData(prev => ({ ...prev, hasChildren: false, numberOfChildren: undefined, childrenAges: undefined }))}
                          className="custom-radio"
                        />
                        <span>No</span>
                      </label>
                    </div>
                    {formData.hasChildren && (
                      <>
                        <div>
                          <label htmlFor="numberOfChildren" className={labelClasses}>Number of Children</label>
                          <input
                            type="number"
                            id="numberOfChildren"
                            name="numberOfChildren"
                            value={formData.numberOfChildren || ''}
                            onChange={handleChange}
                            className={inputClasses}
                            min="1"
                            placeholder="Enter number of children"
                          />
                        </div>
                        <div>
                          <label htmlFor="childrenAges" className={labelClasses}>Children's Ages</label>
                          <input
                            type="text"
                            id="childrenAges"
                            name="childrenAges"
                            value={formData.childrenAges || ''}
                            onChange={handleChange}
                            className={inputClasses}
                            placeholder="e.g., 5, 7, 12"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="suburb" className={labelClasses}>Suburb</label>
                    <input
                      type="text"
                      id="suburb"
                      name="suburb"
                      value={formData.suburb}
                      onChange={handleChange}
                      className={inputClasses}
                      placeholder="Enter your suburb"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className={labelClasses}>State</label>
                    <div className={selectContainerClasses}>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={selectClasses}
                      >
                        {australianStates.map(state => (
                          <option key={state} value={state} className="bg-blue-400/80 text-white">{state}</option>
                        ))}
                      </select>
                      <div className={selectIconClasses}>▼</div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="educationLevel" className={labelClasses}>Education Level</label>
                    <div className={selectContainerClasses}>
                      <select
                        id="educationLevel"
                        name="educationLevel"
                        value={formData.educationLevel}
                        onChange={handleChange}
                        className={selectClasses}
                      >
                        {educationLevels.map(level => (
                          <option key={level} value={level} className="bg-blue-400/80 text-white">{level}</option>
                        ))}
                      </select>
                      <div className={selectIconClasses}>▼</div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="incomeLevel" className={labelClasses}>Income Level</label>
                    <div className={selectContainerClasses}>
                      <select
                        id="incomeLevel"
                        name="incomeLevel"
                        value={formData.incomeLevel}
                        onChange={handleChange}
                        className={selectClasses}
                      >
                        {incomeLevels.map(level => (
                          <option key={level} value={level} className="bg-blue-400/80 text-white">{level}</option>
                        ))}
                      </select>
                      <div className={selectIconClasses}>▼</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-80 mx-auto h-12 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-full font-medium hover:from-cyan-500 hover:to-cyan-600 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center text-white/80 col-span-2">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:underline">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
