'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { inter, playfair } from '@/app/fonts';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Wine, Cigarette, Heart, MapPin, ArrowLeft, MessageCircle } from 'lucide-react';

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
  const [isFavorite, setIsFavorite] = useState(false);

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

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
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
    <div className="relative min-h-screen overflow-hidden bg-[#e8fcfa]">
      {/* Main container with very subtle side border */}
      <div className="w-[95%] mx-auto bg-white h-full overflow-hidden">
        {/* Profile content */}
        <div className="flex flex-col h-full">
          {/* Top section with image background that takes full width */}
          <div className="relative bg-[#FFD6CC]">
            <button onClick={() => router.back()} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white transition-all">
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            {/* Profile image takes up the whole pink area */}
            <div className="w-full aspect-square relative">
              <Image 
                src={userData.profilePhotoUrl || '/images/default-profile.jpg'} 
                alt={`${userData.firstName}'s profile`}
                fill
                className="object-cover"
              />
            </div>
          </div>
          
          {/* Info section with white background and rounded top */}
          <div className="relative -mt-10 bg-white rounded-t-[40px] flex-1 px-7 py-8">
                
            {/* Name and favorite button */}
            <div className="flex justify-between items-start mb-6">
              <div className="mt-2">
                <div className="flex items-baseline">
                  <span className="text-[2.5rem] font-bold text-gray-900" style={{fontFamily: 'Georgia, serif'}}>{userData.firstName},</span>
                  <span className="text-[1.8rem] text-gray-900 ml-2" style={{fontFamily: 'Georgia, serif', position: 'relative', top: '-4px'}}>{userData.age || '39'}</span>
                </div>
                <p className="text-gray-600 text-sm mt-1">{userData.questionnaireAnswers?.location || userData.location || `${userData.suburb || 'Sydney'}, ${userData.state || 'NSW'}`}</p>
              </div>
              <button 
                onClick={toggleFavorite}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                aria-label="Add to favorites"
              >
                <Heart className={`h-6 w-6 ${isFavorite ? 'fill-red-500' : ''} transition-all`} />
              </button>
            </div>
            
            {/* Spacer */}
            <div className="mb-6"></div>
            
            {/* Details with icons */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Details</h2>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                {/* Profession */}
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#3B00CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-700 text-sm" style={{fontFamily: inter.style.fontFamily}}>{userData.questionnaireAnswers?.lifestyle_profession || userData.profession || 'Professional'}</p>
                </div>
                
                {/* Relationship Status */}
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#3B00CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <p className="text-gray-700 text-sm" style={{fontFamily: inter.style.fontFamily}}>Separated</p>
                </div>
                
                {/* Smoking */}
                <div className="flex items-center gap-2">
                  <Cigarette className="h-5 w-5 text-[#3B00CC]" />
                  <p className="text-gray-700 text-sm" style={{fontFamily: inter.style.fontFamily}}>{userData.questionnaireAnswers?.lifestyle_smoking || userData.smokingStatus || 'Non-smoker'}</p>
                </div>
                
                {/* Drinking */}
                <div className="flex items-center gap-2">
                  <Wine className="h-5 w-5 text-[#3B00CC]" />
                  <p className="text-gray-700 text-sm" style={{fontFamily: inter.style.fontFamily}}>{userData.questionnaireAnswers?.lifestyle_drinking || userData.drinkingHabits || 'Social drinker'}</p>
                </div>
                
                {/* Height */}
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#3B00CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-gray-700 text-sm" style={{fontFamily: inter.style.fontFamily}}>{userData.questionnaireAnswers?.physical_height || userData.height || '5\'10"'}</p>
                </div>
                
                {/* Children */}
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#3B00CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-700 text-sm" style={{fontFamily: inter.style.fontFamily}}>{userData.questionnaireAnswers?.hasChildren === false ? 'No children' : 'Has children'}</p>
                </div>
              </div>
            </div>
            
            {/* Interests section with cyan pill boxes */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Interests</h2>
              <div className="grid grid-cols-3 gap-2">
                {userData.interests ? (
                  userData.interests.map((interest, index) => (
                    <div key={index} className="h-10 bg-[#E5FFFE] text-[#008B8B] border border-[#73FFF6] rounded-full text-sm font-medium shadow-sm flex items-center justify-center">
                      {interest}
                    </div>
                  ))
                ) : (
                  ['Reading', 'Travel', 'Fitness', 'Cooking', 'Movies'].map((interest, index) => (
                    <div key={index} className="h-10 bg-[#E5FFFE] text-[#008B8B] border border-[#73FFF6] rounded-full text-sm font-medium shadow-sm flex items-center justify-center">
                      {interest}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Description section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Description</h2>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {userData.personalSummary || 'No personal summary yet. Click the button below to generate one with your profile details.'}
                </p>
                {!userData.personalSummary && (
                  <button 
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                    className="mt-4 px-5 py-2.5 bg-[#73FFF6] text-gray-800 rounded-lg text-sm font-medium hover:bg-[#5EEEE5] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center w-full shadow-sm"
                  >
                    {isGeneratingSummary ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : 'Generate Summary'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Action button */}
            <div className="mt-auto pt-4">
              <button className="w-full py-4 bg-gradient-to-r from-[#5DD2B0] to-[#4CC0A0] text-white rounded-full font-semibold text-lg hover:from-[#4CC0A0] hover:to-[#3BAF8F] transition-all shadow-md flex items-center justify-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
