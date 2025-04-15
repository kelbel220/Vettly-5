'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { inter, playfair } from '@/app/fonts';
import { OrbField } from '@/app/components/gradients/OrbField';
import { HomeOrbField } from '@/app/components/gradients/HomeOrbField';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Wine, Cigarette } from 'lucide-react';

interface UserProfile {
  firstName: string;
  lastName: string;
  profilePhotoUrl: string;
  fullBodyPhotoUrl?: string;
  stylePhotoUrl?: string;
  hobbyPhotoUrl?: string;
  personalSummary?: string;
  questionnaireAnswers?: Record<string, any>;
  questionnaireCompleted?: boolean;
  dob?: string;
  suburb?: string;
  state?: string;
  age?: number;
  location?: string;
  relationshipStatus?: string;
  children?: string;
  height?: string;
  smokingStatus?: string;
  drinkingHabits?: string;
  profession?: string;
  interests?: string[];
}

function Profile() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUserData(userSnap.data() as UserProfile);
          } else {
            // Create a default user profile
            const defaultProfile: UserProfile = {
              firstName: 'New',
              lastName: 'User',
              profilePhotoUrl: '/images/default-profile.jpg',
            };
            setUserData(defaultProfile);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        router.push('/login');
      }
    };

    fetchUserData();
  }, [currentUser, router]);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    
    try {
      // This would typically be an API call to generate a summary
      setTimeout(async () => {
        // For demo purposes, we'll just use a template string
        const summary = `${userData?.firstName || 'User'} is a ${userData?.age || '30'}-year-old ${userData?.profession || 'professional'} from ${userData?.location || 'Sydney'}. They enjoy spending time with friends and family, traveling, and exploring new cuisines.`;
        
        if (currentUser && userData) {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            personalSummary: summary
          });
          
          setUserData({
            ...userData,
            personalSummary: summary
          });
        }
        
        setIsGeneratingSummary(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating summary:', error);
      setIsGeneratingSummary(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#73FFF6] border-t-[#3B00CC] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <h1 className="text-2xl font-bold text-[#3B00CC] mb-4">Profile Not Found</h1>
        <p className="text-gray-600 mb-6">We couldn't find your profile information. Please log in again or complete your profile.</p>
        <button 
          onClick={() => router.push('/login')} 
          className="px-6 py-3 bg-[#3B00CC] text-white rounded-full font-medium shadow-md hover:bg-[#2A008F] transition-all"
        >
          Complete Profile
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Solid white background */}
      <div className="fixed inset-0 bg-white z-0"></div>
      
      {/* Main content container */}
      <div className="relative z-10 w-full">
        {/* Cyan header - extended height */}
        <div className="bg-[#73FFF6] w-full h-[300px] relative">
          {/* Header buttons */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
            <button onClick={() => router.back()} className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-[#3B00CC] hover:bg-white transition-all">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex space-x-2">
              <button className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-[#3B00CC] hover:bg-white transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <button className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-[#3B00CC] hover:bg-white transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-0 -mt-40">
          {/* Main profile content with layered effect */}
          <div className="max-w-5xl mx-auto">
            {/* Profile photo section directly on cyan background */}
            <div className="relative z-20 mb-10">
              {/* Large profile photo - 1:1 proportion without border */}
              <div className="relative aspect-square rounded-3xl overflow-hidden mx-auto max-w-md shadow-lg">
                <Image 
                  src={userData.profilePhotoUrl || '/images/default-profile.jpg'} 
                  alt={`${userData.firstName}'s profile`}
                  fill
                  className="object-cover"
                />
                
                {/* User info at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-4xl font-bold">
                      {userData.firstName}, {userData.age || '39'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-white/90">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{userData.location || `${userData.suburb || 'Sydney'}, ${userData.state || 'NSW'}`}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile details with white background and curved top */}
            <div className="relative z-10">
              {/* Custom curved shape at the top of white section */}
              <div className="h-8 bg-[#73FFF6] relative">
                <div className="absolute -bottom-8 left-0 right-0 h-8 bg-white rounded-t-full"></div>
              </div>
              <div className="bg-white shadow-md overflow-hidden">
                <div className="w-full p-6 pt-10 relative">
                  {/* Photo gallery */}
                  <div className="mb-8 px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`${playfair.className} text-2xl font-medium text-[#3B00CC]`}>Photos</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Full body photo */}
                      <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm max-w-[200px] mx-auto w-full">
                        <Image 
                          src={userData.fullBodyPhotoUrl || '/images/default-full-body.jpg'} 
                          alt="Full body photo"
                          fill
                          className="object-cover"
                        />
                      </div>
                      {/* Style photo */}
                      <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm max-w-[200px] mx-auto w-full">
                        <Image 
                          src={userData.stylePhotoUrl || '/images/default-style.jpg'} 
                          alt="Style photo"
                          fill
                          className="object-cover"
                        />
                      </div>
                      {/* Hobby photo */}
                      <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm max-w-[200px] mx-auto w-full">
                        <Image 
                          src={userData.hobbyPhotoUrl || '/images/default-hobby.jpg'} 
                          alt="Hobby photo"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* About section */}
                  <div className="mb-8 px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`${playfair.className} text-2xl font-medium text-[#3B00CC]`}>About</h3>
                    </div>
                    <div className={`grid grid-cols-2 gap-y-6 gap-x-8 ${inter.className}`}>
                      {/* Relationship Status */}
                      <div>
                        <p className="text-gray-500 text-sm mb-1">Relationship Status</p>
                        <p className="text-gray-800 font-medium">{userData.relationshipStatus || 'Single'}</p>
                      </div>
                      
                      {/* Children */}
                      <div>
                        <p className="text-gray-500 text-sm mb-1">Children</p>
                        <p className="text-gray-800 font-medium">{userData.children || 'No children'}</p>
                      </div>
                      
                      {/* Height */}
                      <div>
                        <p className="text-gray-500 text-sm mb-1">Height</p>
                        <p className="text-gray-800 font-medium">{userData.height || '5\'10"'}</p>
                      </div>
                      
                      {/* Smoking */}
                      <div>
                        <p className="text-gray-500 text-sm mb-1">Smoking</p>
                        <div className="flex items-center gap-2">
                          <Cigarette className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-800 font-medium">{userData.smokingStatus || 'Non-smoker'}</p>
                        </div>
                      </div>
                      
                      {/* Drinking */}
                      <div>
                        <p className="text-gray-500 text-sm mb-1">Drinking</p>
                        <div className="flex items-center gap-2">
                          <Wine className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-800 font-medium">{userData.drinkingHabits || 'Social drinker'}</p>
                        </div>
                      </div>
                      
                      {/* Profession */}
                      <div>
                        <p className="text-gray-500 text-sm mb-1">Profession</p>
                        <p className="text-gray-800 font-medium">{userData.profession || 'Professional'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Personal Summary */}
                  <div className="mb-8 px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`${playfair.className} text-2xl font-medium text-[#3B00CC]`}>Personal Summary</h3>
                    </div>
                    
                    {userData.personalSummary ? (
                      <p className="text-gray-700 leading-relaxed">{userData.personalSummary}</p>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <p className="text-gray-500 mb-4">No personal summary yet. Generate one with your profile details.</p>
                        <button 
                          onClick={handleGenerateSummary}
                          disabled={isGeneratingSummary}
                          className="px-5 py-2 bg-[#3B00CC] text-white rounded-full text-sm font-medium shadow-sm hover:bg-[#2A008F] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto"
                        >
                          {isGeneratingSummary ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating Summary...
                            </>
                          ) : (
                            'Generate Summary'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
