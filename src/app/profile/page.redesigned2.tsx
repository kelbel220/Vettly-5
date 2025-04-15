'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { inter, playfair } from '@/app/fonts';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Heart, MapPin, ArrowLeft, ChevronRight } from 'lucide-react';

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
  const [showFullSummary, setShowFullSummary] = useState(false);

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
        const summary = `My name is ${userData?.firstName || 'User'} and I enjoy meeting new people and finding ways to help them have an uplifting experience. I enjoy reading, traveling, and exploring new places. I'm a ${userData?.age || '30'}-year-old ${userData?.profession || 'professional'} from ${userData?.location || 'Sydney'} looking for meaningful connections.`;
        
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

  const toggleSummary = () => {
    setShowFullSummary(!showFullSummary);
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

  // Prepare gallery images
  const galleryImages = [
    userData.fullBodyPhotoUrl || '/images/default-full-body.jpg',
    userData.stylePhotoUrl || '/images/default-style.jpg',
    userData.hobbyPhotoUrl || '/images/default-hobby.jpg',
    userData.profilePhotoUrl || '/images/default-profile.jpg',
    userData.profilePhotoUrl || '/images/default-profile.jpg'
  ];

  // Default interests if none provided
  const interests = userData.interests || ['Traveling', 'Books', 'Music', 'Dancing', 'Modeling'];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50">
      {/* Main container */}
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-sm">
        {/* Profile header with image */}
        <div className="relative">
          {/* Full-width profile image */}
          <div className="relative w-full aspect-[3/4]">
            <Image 
              src={userData.profilePhotoUrl || '/images/default-profile.jpg'} 
              alt={`${userData.firstName}'s profile`}
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Back button */}
          <button 
            onClick={() => router.back()} 
            className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          {/* Action buttons at bottom of image */}
          <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-6">
              <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-md text-orange-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button 
                onClick={toggleFavorite}
                className={`w-16 h-16 flex items-center justify-center rounded-full shadow-md ${isFavorite ? 'bg-red-500 text-white' : 'bg-red-500 text-white'}`}
              >
                <Heart className={`h-8 w-8 ${isFavorite ? 'fill-white' : 'fill-white'}`} />
              </button>
              <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-md text-purple-600">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Profile content */}
        <div className="px-5 pt-10 pb-6">
          {/* Name and basic info */}
          <div className="mb-5">
            <div className="flex items-end justify-between">
              <h1 className="text-2xl font-bold text-gray-800">
                {userData.firstName} {userData.lastName}, {userData.age || '39'}
              </h1>
              <button className="text-pink-500">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 text-sm">{userData.profession || 'Professional'}</p>
          </div>
          
          {/* Location */}
          <div className="mb-6">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-pink-500" />
              <span className="text-gray-600 text-sm">{userData.location || `${userData.suburb || 'Golden Bay'}, ${userData.state || 'WA'}`}</span>
              <span className="ml-1 text-pink-500 text-xs">1 km</span>
            </div>
          </div>
          
          {/* About section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">About</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {userData.personalSummary 
                ? (showFullSummary 
                    ? userData.personalSummary 
                    : userData.personalSummary.substring(0, 120) + '...')
                : 'No personal summary yet. Click the button below to generate one with your profile details.'}
            </p>
            {userData.personalSummary && (
              <button 
                onClick={toggleSummary} 
                className="text-pink-500 text-sm font-medium mt-1"
              >
                {showFullSummary ? 'Show less' : 'Read more'}
              </button>
            )}
            {!userData.personalSummary && (
              <button 
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="mt-2 text-pink-500 text-sm font-medium flex items-center"
              >
                {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
              </button>
            )}
          </div>
          
          {/* Interests */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <div key={index} className={`px-3 py-1.5 rounded-full text-sm ${index < 2 ? 'bg-pink-100 text-pink-500 border border-pink-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                  {index < 2 && <span className="mr-1">✓</span>}
                  {interest}
                </div>
              ))}
            </div>
          </div>
          
          {/* Gallery */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-800">Gallery</h2>
              <button className="text-pink-500 text-sm font-medium">See all</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {galleryImages.slice(0, 6).map((image, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                  <Image 
                    src={image} 
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
