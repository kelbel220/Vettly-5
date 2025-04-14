'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { inter } from '@/app/fonts';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';

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
}

export default function Profile() {
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
            const data = userSnap.data() as UserProfile;
            
            // Calculate age from DOB if available
            if (data.dob) {
              const dobDate = new Date(data.dob);
              const today = new Date();
              let age = today.getFullYear() - dobDate.getFullYear();
              const monthDiff = today.getMonth() - dobDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
                age--;
              }
              data.age = age;
            }
            
            // Combine suburb and state for location
            if (data.suburb && data.state) {
              data.location = `${data.suburb}, ${data.state}`;
            } else if (data.suburb) {
              data.location = data.suburb;
            } else if (data.state) {
              data.location = data.state;
            }
            
            // Extract data from questionnaire answers if available
            if (data.questionnaireAnswers) {
              const answers = data.questionnaireAnswers;
              
              // Extract relationship status
              if (answers['relationship_status']) {
                data.relationshipStatus = answers['relationship_status'];
              }
              
              // Extract children information
              if (answers['children']) {
                data.children = answers['children'];
              }
              
              // Extract height
              if (answers['height']) {
                data.height = answers['height'];
              }
              
              // Extract smoking status
              if (answers['smoking']) {
                const smokingAnswer = answers['smoking'];
                if (smokingAnswer === 'No, and I never have' || smokingAnswer === 'No, but I used to') {
                  data.smokingStatus = 'Non smoker';
                } else if (smokingAnswer === 'Occasionally (socially or on rare occasions)') {
                  data.smokingStatus = 'Occasional smoker';
                } else {
                  data.smokingStatus = 'Smoker';
                }
              }
              
              // Extract drinking habits
              if (answers['drinking']) {
                const drinkingAnswer = answers['drinking'];
                if (drinkingAnswer === 'Never' || drinkingAnswer === 'Rarely (a few times a year)') {
                  data.drinkingHabits = 'Non drinker';
                } else if (drinkingAnswer === 'Socially (a few times a month)') {
                  data.drinkingHabits = 'Social drinker';
                } else {
                  data.drinkingHabits = 'Regular drinker';
                }
              }
              
              // Extract profession
              if (answers['profession']) {
                data.profession = answers['profession'];
              }
            }
            
            setUserData(data);
          } else {
            console.error('No user document found');
            router.push('/profile/complete');
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
    if (!userData || isGeneratingSummary) return;
    
    setIsGeneratingSummary(true);
    
    try {
      // In a real app, this would call an API to generate the summary
      // For now, we'll just simulate a delay and set a placeholder
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const summary = `${userData.firstName}, you're an extroverted, spontaneous individual with a calm and grounded personality. You love reading, enjoy mixing things up, and have a high regard for health. As a ${userData.profession || 'professional'}, you've learned the importance of balance - between work and personal life, and also in relationships, where you appreciate a blend of independence and togetherness. You value self-awareness, empathy, and optimism in your partner and look for honesty above all.`;
      
      // Update the user data in Firestore
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          personalSummary: summary
        });
        
        // Update local state
        setUserData(prev => prev ? {...prev, personalSummary: summary} : null);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3B00CC]"></div>
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
        <p className="text-gray-600 mb-6">Please complete your profile to continue.</p>
        <button
          onClick={() => router.push('/profile/complete')}
          className="bg-[#3B00CC] text-white px-6 py-2 rounded-full hover:bg-[#2800A3] transition-colors"
        >
          Complete Profile
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#f0f4ff] to-white z-0"></div>
      
      {/* Main content container */}
      <div className="relative z-10 w-full py-6 px-4 sm:px-6 lg:px-8 xl:px-0">
        <div className="max-w-7xl mx-auto">
          {/* Header with navigation */}
          <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center">
              <button onClick={() => router.back()} className="mr-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-all">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-medium text-gray-800">Profile</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-[#3B00CC] hover:text-[#2800A3] transition-all">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Main profile section with clean design */}
          <div className="lg:flex lg:gap-8 lg:min-h-[700px]">
            {/* Left column - Main profile photo */}
            <div className="lg:w-[45%] xl:w-[40%] rounded-3xl overflow-hidden shadow-md">
              <div className="relative h-[600px] lg:h-[800px]">
                <Image
                  src={userData.profilePhotoUrl || '/placeholder-profile.jpg'}
                  alt={`${userData.firstName}'s profile photo`}
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Bottom gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-black/70 to-transparent"></div>
                
                {/* Match score */}
                <div className="absolute top-6 right-6 bg-white rounded-full px-3 py-1 shadow-md flex items-center">
                  <span className="text-[#3B00CC] font-bold">9.2</span>
                  <span className="text-gray-500 text-sm ml-1">Match</span>
                </div>
                
                {/* User info at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-4xl font-bold">
                      {userData.firstName}, {userData.age || '39'}
                    </h2>
                    <svg className="h-6 w-6 text-[#73FFF6]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-white/90">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>{userData.location || 'Golden Bay, WA'}</span>
                  </div>
                  
                  {/* Quick stats */}
                  <div className="flex gap-3 mt-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                      <span className="text-white">💼 {userData.profession || 'Lawyer'}</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                      <span className="text-white">🍷 {userData.drinkingHabits || 'Social drinker'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column - Details and information */}
            <div className="lg:w-[55%] xl:w-[60%] pt-6 lg:pt-0">
              {/* Photo gallery */}
              <div className="mb-8 px-6 lg:px-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-medium text-gray-800">Photos</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {userData.fullBodyPhotoUrl && (
                    <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm">
                      <Image
                        src={userData.fullBodyPhotoUrl}
                        alt="Full Body Photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  {userData.stylePhotoUrl && (
                    <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm">
                      <Image
                        src={userData.stylePhotoUrl}
                        alt="Style Photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  {userData.hobbyPhotoUrl && (
                    <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm">
                      <Image
                        src={userData.hobbyPhotoUrl}
                        alt="Hobby Photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* About section */}
              <div className="mb-8 px-6 lg:px-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-medium text-gray-800">About</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                  {/* Relationship Status */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                      <svg className="h-5 w-5 text-[#3B00CC]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Relationship</div>
                      <div className="text-sm font-medium text-gray-800">{userData.relationshipStatus || 'Divorced'}</div>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                      <svg className="h-5 w-5 text-[#3B00CC]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Children</div>
                      <div className="text-sm font-medium text-gray-800">{userData.children || 'No children'}</div>
                    </div>
                  </div>

                  {/* Height */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                      <svg className="h-5 w-5 text-[#3B00CC]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 5.5V7h3V5.5c0-.83-.67-1.5-1.5-1.5S13 4.67 13 5.5zM13 11h3V9h-3v2zm0 4h3v-2h-3v2zm0 4h3v-2h-3v2zM7 5.5V7h3V5.5C10 4.67 9.33 4 8.5 4S7 4.67 7 5.5zM7 11h3V9H7v2zm0 4h3v-2H7v2zm0 4h3v-2H7v2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Height</div>
                      <div className="text-sm font-medium text-gray-800">{userData.height || '162cm'}</div>
                    </div>
                  </div>

                  {/* Smoking Status */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                      <span className="text-lg">🚬</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Smoking</div>
                      <div className="text-sm font-medium text-gray-800">{userData.smokingStatus || 'Non smoker'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio section */}
              <div className="mb-8 px-6 lg:px-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-medium text-gray-800">Bio</h3>
                  {userData.personalSummary && (
                    <button
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary}
                      className="text-xs text-[#3B00CC] hover:text-[#5B00FF]"
                    >
                      Regenerate
                    </button>
                  )}
                </div>
                
                {userData.personalSummary ? (
                  <div className="text-gray-700 text-sm leading-relaxed">
                    {userData.personalSummary}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      Get a personalized summary based on your questionnaire answers.
                    </p>
                    <button
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary}
                      className="bg-[#3B00CC] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#2800A3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingSummary ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                          Generating...
                        </>
                      ) : (
                        'Generate Summary'
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-between items-center mt-6 px-6 lg:px-8 pb-6">
                <button
                  onClick={() => router.push('/profile/images')}
                  className="bg-[#F6F8FA] text-[#2800A3] px-6 py-3 rounded-full text-sm font-medium hover:bg-[#E6F7FF] transition-colors shadow-sm"
                >
                  Edit Photos
                </button>
                <div className="flex gap-3">
                  <button className="bg-white border border-gray-200 text-gray-500 p-3 rounded-full shadow-sm hover:bg-gray-50">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button className="bg-[#73FFF6] text-[#3B00CC] p-3 rounded-full shadow-sm hover:bg-[#73FFF6]/90">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
