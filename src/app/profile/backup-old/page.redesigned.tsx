'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { inter, playfair } from '@/app/fonts';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Wine, Cigarette, Heart, MapPin, ArrowLeft } from 'lucide-react';

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
    <div className="relative min-h-screen bg-[#73FFF6] overflow-hidden">
      {/* Main container with rounded corners */}
      <div className="max-w-md mx-auto bg-white h-full rounded-3xl overflow-hidden shadow-lg">
        {/* Profile content */}
        <div className="flex flex-col h-full">
          {/* Top section with image background */}
          <div className="relative bg-[#FFD6CC] p-6 pb-32">
            <button onClick={() => router.back()} className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white transition-all">
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            {/* Profile image centered */}
            <div className="flex justify-center items-center mt-4">
              <div className="relative w-64 h-64">
                <Image 
                  src={userData.profilePhotoUrl || '/images/default-profile.jpg'} 
                  alt={`${userData.firstName}'s profile`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          
          {/* Info section with white background and rounded top */}
          <div className="relative -mt-10 bg-white rounded-t-[40px] flex-1 p-6">
            {/* Name and favorite button */}
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-3xl font-bold text-gray-800">{userData.firstName}</h1>
              <button 
                onClick={toggleFavorite}
                className="p-2 text-red-500"
              >
                <Heart className={`h-6 w-6 ${isFavorite ? 'fill-red-500' : ''}`} />
              </button>
            </div>
            
            {/* Basic info */}
            <div className="mb-4">
              <p className="text-gray-600">{userData.profession || 'Professional'}</p>
              <p className="text-gray-600">{userData.age || '39'} years | {userData.relationshipStatus || 'Single'}</p>
              <div className="flex items-center gap-1 mt-1 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{userData.location || `${userData.suburb || 'Sydney'}, ${userData.state || 'NSW'}`}</span>
              </div>
            </div>
            
            {/* Description section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Description</h2>
              <p className="text-gray-600 text-sm">
                {userData.personalSummary || 'No personal summary yet. Click the button below to generate one with your profile details.'}
              </p>
              {!userData.personalSummary && (
                <button 
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="mt-4 px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center w-full"
                >
                  {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
                </button>
              )}
            </div>
            
            {/* Action button */}
            <div className="mt-auto">
              <button className="w-full py-4 bg-[#5DD2B0] text-white rounded-full font-semibold text-lg hover:bg-[#4CC0A0] transition-all">
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
