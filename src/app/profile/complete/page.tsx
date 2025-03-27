'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { inter, playfair } from '@/app/fonts';
import { OrbField } from '@/app/components/gradients/OrbField';

interface ProfileData {
  dob: string;
  sex: 'male' | 'female' | 'other';
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

export default function CompleteProfile() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    dob: '',
    sex: 'male',
    suburb: '',
    state: 'NSW',
    educationLevel: 'Bachelor\'s Degree',
    incomeLevel: '$70,000 - $100,000'
  });

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Load existing profile data
    const loadProfile = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(prev => ({
            ...prev,
            ...data
          }));
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };

    loadProfile();
  }, [currentUser, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('No user found');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // Update user profile in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...formData,
        updatedAt: new Date().toISOString()
      });

      router.push('/dashboard');
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full h-12 bg-white/10 rounded-full px-6 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/30";
  const selectClasses = "w-full h-12 bg-white/10 rounded-full px-6 text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/30";
  const labelClasses = "block text-sm font-medium text-white/80 mb-1 ml-4";

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-cyan-400 to-purple-400 ${inter.className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0">
        <OrbField />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-7xl px-6 py-8">
        {/* Profile Completion Card */}
        <div className="w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-lg border border-white/20">
          <div className="flex flex-col md:flex-row md:gap-12">
            {/* Left Section - Header and Info */}
            <div className="md:w-1/3 mb-8 md:mb-0">
              <h1 className={`text-4xl font-bold text-white mb-6 ${playfair.className}`}>COMPLETE YOUR PROFILE</h1>
              <div className="hidden md:block">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 mx-auto mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-white/80 text-center">Complete your profile to unlock all features and personalize your experience.</p>
                </div>
              </div>
            </div>

            {/* Right Section - Form */}
            <div className="md:w-2/3">
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl text-white text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  {/* Date of Birth */}
                  <div>
                    <label htmlFor="dob" className={labelClasses}>Date of Birth</label>
                    <input
                      id="dob"
                      name="dob"
                      type="date"
                      required
                      className={inputClasses}
                      value={formData.dob}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Sex */}
                  <div>
                    <label htmlFor="sex" className={labelClasses}>Sex</label>
                    <select
                      id="sex"
                      name="sex"
                      required
                      className={selectClasses}
                      value={formData.sex}
                      onChange={handleChange}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Suburb */}
                  <div>
                    <label htmlFor="suburb" className={labelClasses}>Suburb</label>
                    <input
                      id="suburb"
                      name="suburb"
                      type="text"
                      required
                      className={inputClasses}
                      value={formData.suburb}
                      onChange={handleChange}
                      placeholder="Enter your suburb"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label htmlFor="state" className={labelClasses}>State</label>
                    <select
                      id="state"
                      name="state"
                      required
                      className={selectClasses}
                      value={formData.state}
                      onChange={handleChange}
                    >
                      {australianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  {/* Education Level */}
                  <div>
                    <label htmlFor="educationLevel" className={labelClasses}>Education Level</label>
                    <select
                      id="educationLevel"
                      name="educationLevel"
                      required
                      className={selectClasses}
                      value={formData.educationLevel}
                      onChange={handleChange}
                    >
                      {educationLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  {/* Income Level */}
                  <div>
                    <label htmlFor="incomeLevel" className={labelClasses}>Income Level</label>
                    <select
                      id="incomeLevel"
                      name="incomeLevel"
                      required
                      className={selectClasses}
                      value={formData.incomeLevel}
                      onChange={handleChange}
                    >
                      {incomeLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-white/20 backdrop-blur-sm text-white rounded-full font-medium hover:bg-white/30 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/30"
                >
                  {loading ? 'Saving...' : 'Complete Profile'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
