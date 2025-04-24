'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { inter, playfair } from '@/app/fonts';
import { OrbField } from '@/app/components/gradients/OrbField';
import { HomeOrbField } from '@/app/components/gradients/HomeOrbField';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase-init';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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

export default function Profile() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

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

  const handlePhotoClick = (photoType: string) => {
    setUploadingPhoto(photoType);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !uploadingPhoto) return;

    try {
      setIsLoading(true);
      const storage = getStorage();
      const fileRef = ref(storage, `users/${currentUser.uid}/${uploadingPhoto}_${Date.now()}`);
      
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      
      const userRef = doc(db, 'users', currentUser.uid);
      let updateData = {};
      
      if (uploadingPhoto === 'profilePhoto') {
        updateData = { profilePhotoUrl: downloadURL };
      } else if (uploadingPhoto === 'fullBodyPhoto') {
        updateData = { fullBodyPhotoUrl: downloadURL };
      } else if (uploadingPhoto === 'stylePhoto') {
        updateData = { stylePhotoUrl: downloadURL };
      } else if (uploadingPhoto === 'hobbyPhoto') {
        updateData = { hobbyPhotoUrl: downloadURL };
      }
      
      await updateDoc(userRef, updateData);
      
      // Update local state
      if (userData) {
        setUserData({
          ...userData,
          ...updateData
        });
      }
      
      setIsLoading(false);
      setUploadingPhoto(null);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setIsLoading(false);
      setUploadingPhoto(null);
    }
  };

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
              profilePhotoUrl: '/placeholder-profile.jpg',
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
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Solid white background */}
      <div className="fixed inset-0 bg-white z-0"></div>
      
      {/* Main content container */}
      <div className="relative z-10 w-full">
        {/* Cyan header */}
        <div className="bg-[#73FFF6] w-full h-[180px] relative">
          {/* Header buttons */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-[#3B00CC] hover:bg-white transition-all" onClick={() => router.back()}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-[#3B00CC] hover:bg-white transition-all">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-0 -mt-20">
          {/* Main profile content with layered effect */}
          <div className="max-w-5xl mx-auto">
            {/* Profile photo section with curved white background */}
            <div className="relative z-10 mb-6">
              <div className="bg-white rounded-t-[40px] pt-6 pb-4 shadow-md">
                {/* Large profile photo */}
                <div className="relative w-full h-[400px] rounded-3xl overflow-hidden mx-auto max-w-md shadow-lg border-2 border-[#73FFF6]">
                  <Image
                    src={userData.profilePhotoUrl || "/placeholder-profile.jpg"}
                    alt={`${userData.firstName}'s profile`}
                    fill
                    className="object-cover"
                    onClick={() => handlePhotoClick('profilePhoto')}
                  />
                  {uploadingPhoto === 'profilePhoto' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                {/* Profile name and actions */}
                <div className="flex justify-between items-center px-6 lg:px-8 mt-4">
                  <div>
                    <h1 className={`${playfair.className} text-3xl font-bold text-[#3B00CC]`}>
                      {userData.firstName} {userData.lastName}
                    </h1>
                    <p className={`${inter.className} text-gray-500 text-sm`}>
                      {userData.age} • {userData.location || `${userData.suburb || 'Sydney'}, ${userData.state || 'NSW'}`}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={toggleFavorite}
                      className={`p-2 rounded-full ${isFavorite ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'} hover:bg-pink-500 hover:text-white transition-colors`}
                    >
                      <svg className="h-6 w-6" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-[#3B00CC] hover:text-white transition-colors">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content sections with white background */}
            <div className="bg-white rounded-b-[40px] shadow-md overflow-hidden">
              {/* Details section */}
              <div className="mb-8 px-6 lg:px-8 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`${playfair.className} text-2xl font-medium text-[#3B00CC]`}>Details</h3>
                  <div className="h-1 w-12 bg-[#73FFF6] rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-gray-500 text-xs mb-1">Profession</p>
                      <p className="text-gray-800 font-medium">{userData.profession || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-gray-500 text-xs mb-1">Height</p>
                      <p className="text-gray-800 font-medium">{userData.height || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-gray-500 text-xs mb-1">Smoking</p>
                      <p className="text-gray-800 font-medium">{userData.smokingStatus || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-gray-500 text-xs mb-1">Drinking</p>
                      <p className="text-gray-800 font-medium">{userData.drinkingHabits || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Interests section */}
              <div className="mb-8 px-6 lg:px-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`${playfair.className} text-2xl font-medium text-[#3B00CC]`}>Interests</h3>
                  <div className="h-1 w-12 bg-[#73FFF6] rounded-full"></div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {userData.interests ? (
                    userData.interests.map((interest, index) => (
                      <span key={index} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm">
                        {interest}
                      </span>
                    ))
                  ) : (
                    ['Reading', 'Travel', 'Fitness', 'Cooking', 'Movies'].map((interest, index) => (
                      <span key={index} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm">
                        {interest}
                      </span>
                    ))
                  )}
                </div>
              </div>
              
              {/* Bio section */}
              <div className="mb-8 px-6 lg:px-8 mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`${playfair.className} text-2xl font-medium text-[#3B00CC]`}>Bio</h3>
                  <div className="h-1 w-12 bg-[#73FFF6] rounded-full"></div>
                </div>
                
                {userData.personalSummary ? (
                  <div className={`${inter.className} text-gray-700 text-sm leading-relaxed`}>
                    Bob, you're an extroverted, spontaneous individual with a calm and grounded personality. You love reading, enjoy mixing things up, and have a high regard for health. As a lawyer, you've learned the importance of balance - between work and personal life, and also in relationships, where you appreciate a blend of independence and togetherness. You value self-awareness, empathy, and optimism in your partner and look for honesty above all. In relationships, you're all in, ready to support your partner financially while expecting the same degree of emotional connection. You're a person who addresses conflicts straight away and prefers to take the lead but makes decisions logically, considering all pros and cons. Physical attraction and intimacy are crucial to you, and you're open to your partner's choices in cosmetic enhancements. For you, it's important that your partner doesn't have children from previous relationships. You're comfortable with your partner's occasional social use of drugs or alcohol, provided it's respectful. You also value your alone time to recharge and handle stress.
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      Get a personalized summary based on your questionnaire answers.
                    </p>
                    <button
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary}
                      className="bg-[#3B00CC] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#2800A3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#73FFF6]"
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
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden file input for photo uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
