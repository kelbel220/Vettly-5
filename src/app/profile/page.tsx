'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { inter, playfair } from '@/app/fonts';
import { OrbField } from '@/app/components/gradients/OrbField';
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
            setUserData(userSnap.data() as UserProfile);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [currentUser, router]);
  
  const handleGenerateSummary = async () => {
    console.log('Generate Summary button clicked');
    
    if (!currentUser) {
      console.error('No current user found');
      alert('You need to be logged in to generate a summary.');
      return;
    }
    
    if (!userData) {
      console.error('No user data found');
      alert('User data is not available. Please try again later.');
      return;
    }
    
    if (!userData.questionnaireAnswers) {
      console.error('No questionnaire answers found');
      alert('You need to complete the questionnaire first!');
      return;
    }
    
    setIsGeneratingSummary(true);
    console.log('User data being used:', userData);
    console.log('First name being sent:', userData.firstName);
    
    try {
      const requestData = { 
        questionnaireAnswers: userData.questionnaireAnswers,
        firstName: userData.firstName || 'Bob' // Provide a default name if firstName is undefined
      };
      
      console.log('Data being sent to API:', requestData);
      
      // Call our API endpoint to generate the summary
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        
        if (data.summary) {
          console.log('Summary received, updating Firestore');
          // Update the user document with the new summary
          const userRef = doc(db, 'users', currentUser.uid);
          try {
            await updateDoc(userRef, {
              personalSummary: data.summary
            });
            console.log('Firestore updated successfully');
            
            // Update local state
            setUserData(prev => {
              console.log('Updating local state with new summary');
              return prev ? {
                ...prev,
                personalSummary: data.summary
              } : null;
            });
          } catch (error) {
            console.error('Error updating Firestore:', error);
            alert('Error saving your summary. Please try again.');
          }
        } else {
          console.error('No summary in response data');
          alert('Failed to generate a summary. Please try again.');
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to generate summary:', errorText);
        alert('Failed to generate summary. Please try again later.');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('An error occurred while generating your summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className={`${playfair.className} text-2xl font-bold text-gray-800 mb-4`}>
            Profile Not Found
          </h2>
          <button
            onClick={() => router.push('/profile/complete')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Complete Your Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      <OrbField />
      {/* Purple orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-500/30 to-purple-600/30 blur-3xl" />
      
      <div className="relative z-10 w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-8">
            <Image
              src="/vettly-logo.png"
              alt="Vettly Logo"
              width={180}
              height={45}
              className="h-auto w-auto"
              priority
            />
          </div>

          <div className="text-center mb-12">
            <h2 className={`${playfair.className} text-4xl font-bold text-white mb-3`}>
              {userData.firstName} {userData.lastName}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Profile Photo */}
            <div className="relative aspect-square backdrop-blur-md bg-white/15 rounded-xl border border-white/30 p-3 overflow-hidden group hover:bg-white/20 hover:border-white/40">
              <div className="absolute inset-0 p-3">
                <div className="relative w-full h-full">
                  <Image
                    src={userData.profilePhotoUrl}
                    alt="Profile Photo"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <p className={`${inter.className} text-white font-medium`}>Profile Photo</p>
              </div>
            </div>

            {/* Full Body Photo */}
            {userData.fullBodyPhotoUrl && (
              <div className="relative aspect-square backdrop-blur-md bg-white/15 rounded-xl border border-white/30 p-3 overflow-hidden group hover:bg-white/20 hover:border-white/40">
                <div className="absolute inset-0 p-3">
                  <div className="relative w-full h-full">
                    <Image
                      src={userData.fullBodyPhotoUrl}
                      alt="Full Body Photo"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                  <p className={`${inter.className} text-white font-medium`}>Full Body Photo</p>
                </div>
              </div>
            )}

            {/* Style Photo */}
            {userData.stylePhotoUrl && (
              <div className="relative aspect-square backdrop-blur-md bg-white/15 rounded-xl border border-white/30 p-3 overflow-hidden group hover:bg-white/20 hover:border-white/40">
                <div className="absolute inset-0 p-3">
                  <div className="relative w-full h-full">
                    <Image
                      src={userData.stylePhotoUrl}
                      alt="Style Photo"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                  <p className={`${inter.className} text-white font-medium`}>Personal Style</p>
                </div>
              </div>
            )}

            {/* Hobby Photo */}
            {userData.hobbyPhotoUrl && (
              <div className="relative aspect-square backdrop-blur-md bg-white/15 rounded-xl border border-white/30 p-3 overflow-hidden group hover:bg-white/20 hover:border-white/40">
                <div className="absolute inset-0 p-3">
                  <div className="relative w-full h-full">
                    <Image
                      src={userData.hobbyPhotoUrl}
                      alt="Hobby Photo"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                  <p className={`${inter.className} text-white font-medium`}>Something You Love</p>
                </div>
              </div>
            )}
          </div>

          {/* Personal Summary Section */}
          <div className="mt-12 max-w-2xl mx-auto">
            {userData.personalSummary ? (
              <div className="backdrop-blur-md bg-white/15 rounded-xl border border-white/30 p-6 overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <h3 className={`${playfair.className} text-2xl font-bold text-white`}>
                    About {userData.firstName}
                  </h3>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                    className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
                <div className={`${inter.className} text-white leading-relaxed whitespace-pre-line`}>
                  {userData.personalSummary}
                </div>
              </div>
            ) : (
              <div className="backdrop-blur-md bg-white/15 rounded-xl border border-white/30 p-6 overflow-hidden text-center">
                <h3 className={`${playfair.className} text-2xl font-bold text-white mb-4`}>
                  Generate Your Profile Summary
                </h3>
                <p className={`${inter.className} text-white mb-6`}>
                  Get a personalized summary based on your questionnaire answers.
                </p>
                <button
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="bg-[#73FFF6] text-[#3B00CC] px-6 py-3 rounded-full font-medium hover:bg-[#73FFF6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingSummary ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-[#3B00CC] border-t-transparent rounded-full animate-spin mr-2"></span>
                      Generating...
                    </>
                  ) : (
                    'Generate Summary'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Edit Photos Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/profile/images')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Edit Photos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
