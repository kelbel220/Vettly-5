'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { OrbField } from '../components/gradients/OrbField';
import { AnimatedText } from '../components/text/AnimatedText';
import { useWeeklyTip } from '@/hooks/useWeeklyTip';
import { WeeklyTipButton } from '@/components/tips/WeeklyTipButton';
import { WeeklyTipModal } from '@/components/tips/WeeklyTipModal';
import { format } from 'date-fns';
import Image from 'next/image';
import { inter, playfair } from '../fonts';
import { useAuth, AuthContextType } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useRouter } from 'next/navigation';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { EventCalendar } from '@/components/calendar/EventCalendar';

// Add JSX type definitions
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface UserData {
  firstName: string;
  lastName: string;
  profilePhotoUrl: string;
  questionnaireCompleted?: boolean;
  completedSections?: Record<string, boolean>;
}

export default function Dashboard() {
  const auth: AuthContextType = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userDataState, setUserData] = useState<UserData | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileImage, setProfileImage] = useState('/placeholder-profile.jpg');
  const [showQuestionnairePopup, setShowQuestionnairePopup] = useState(false);
  
  // Use the weekly tip hook
  const { 
    tip, 
    loading: tipLoading, 
    error: tipError, 
    hasUserSeen, 
    showTipModal, 
    setShowTipModal, 
    markTipAsSeen, 
    dismissTip,
    refreshTip
  } = useWeeklyTip();
  
  // Always refresh the weekly tip when the dashboard mounts
  useEffect(() => {
    console.log('Dashboard mounted, refreshing weekly tip with force refresh');
    // Use forceRefresh=true to bypass cache and get fresh data from Firestore
    refreshTip(true);
  }, [refreshTip]);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await auth.logout();
    router.push('/login');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          console.log('Current user ID:', auth.currentUser.uid);
          console.log('Current user photoURL:', auth.currentUser.photoURL);
          
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data() as UserData;
            console.log('User data from Firestore:', data);
            setUserData(data);
            
            // Check if questionnaire is not completed and show popup
            if (data.questionnaireCompleted === false || data.questionnaireCompleted === undefined) {
              setShowQuestionnairePopup(true);
            }
            
            // Try to get profile photo URL from user document first, then fall back to auth user photoURL
            if (data.profilePhotoUrl) {
              console.log('Found profilePhotoUrl in Firestore:', data.profilePhotoUrl);
              setImageError(false);
              setProfileImage(data.profilePhotoUrl);
            } else if (auth.currentUser.photoURL) {
              console.log('Using auth user photoURL:', auth.currentUser.photoURL);
              setImageError(false);
              setProfileImage(auth.currentUser.photoURL);
            } else {
              console.log('No profile image found, using placeholder');
              setImageError(true);
            }
          } else {
            console.log('No user document found in Firestore');
            if (auth.currentUser.photoURL) {
              console.log('Using auth user photoURL:', auth.currentUser.photoURL);
              setImageError(false);
              setProfileImage(auth.currentUser.photoURL);
            } else {
              console.log('No photoURL in auth user, using placeholder');
              setImageError(true);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Still try to use auth user photoURL if available
          if (auth.currentUser.photoURL) {
            console.log('Using auth user photoURL after error:', auth.currentUser.photoURL);
            setImageError(false);
            setProfileImage(auth.currentUser.photoURL);
          } else {
            console.log('No photoURL available after error, using placeholder');
            setImageError(true);
          }
        }
      } else {
        console.log('No current user');
        setImageError(true);
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [auth.currentUser]);

  useEffect(() => {
    console.log('Profile image updated:', profileImage);
    console.log('Image error state:', imageError);
  }, [profileImage, imageError]);

  const handleImageError = () => {
    console.log('Error loading image:', profileImage);
    setImageError(true);
    // Don't set a new profileImage path, just show the fallback UI
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', profileImage);
    setImageError(false);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImageError(false);
      setProfileImage(imageUrl);
    }
  };

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };
  
  const startQuestionnaire = () => {
    setShowQuestionnairePopup(false);
    router.push('/questionnaire');
  };

  const closeQuestionnairePopup = () => {
    setShowQuestionnairePopup(false);
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden">
        {/* Background container with fixed position to cover entire viewport */}
        <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
          <div className="absolute inset-0 overflow-hidden">
            <OrbField />
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <div className="w-64 h-64 rounded-full bg-white/10 animate-pulse mb-8" />
          <div className="h-8 w-64 bg-white/10 animate-pulse mb-4 rounded" />
          <div className="h-4 w-48 bg-white/10 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!userDataState && !isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden">
        {/* Background container with fixed position to cover entire viewport */}
        <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
          <div className="absolute inset-0 overflow-hidden">
            <OrbField />
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-screen">
          <div className="text-center">
            <h2 className={`${inter.className} text-2xl font-bold mb-4`}>
              Profile Not Found
            </h2>
            <button
              onClick={() => router.push('/profile/complete')}
              className="bg-[#34D8F1] text-white px-6 py-2 rounded-lg hover:bg-[#34D8F1]/90 transition-colors"
            >
              Complete Your Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col lg:flex-row">
      {/* Background container with fixed position to cover entire viewport */}
      <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
        <div className="absolute inset-0 overflow-hidden">
          <OrbField />
        </div>
      </div>
      
      {/* Questionnaire Popup */}
      <Dialog
        open={showQuestionnairePopup}
        onClose={closeQuestionnairePopup}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <Dialog.Title className={`${playfair.className} text-2xl font-semibold text-gray-900 mb-4`}>
              Complete Your Questionnaire
            </Dialog.Title>
            
            <div className="mb-6">
              <p className="text-gray-600">
                Help us understand your preferences and find your perfect match by completing a quick questionnaire.
              </p>
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                onClick={closeQuestionnairePopup}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Later
              </button>
              <button
                onClick={startQuestionnaire}
                className="px-6 py-2 bg-[#3B00CC] text-white rounded-lg hover:bg-[#3B00CC]/90 transition-colors"
              >
                Start Now
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      
      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col pb-[80px] lg:pb-0">

        {/* Content Container */}
        <div className="relative h-full z-10">
          <div className="h-full overflow-y-auto px-4 py-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="/vettly-logo.png"
                alt="Vettly Logo"
                width={120}
                height={30}
                className=""
                priority
              />
            </div>

            {/* Welcome Section with Profile Picture */}
            <section className="text-center max-w-6xl mx-auto">
              <div className="relative w-64 h-64 md:w-72 md:h-72 mx-auto mb-8 group cursor-pointer" onClick={() => router.push('/profile')}>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="w-full h-full relative">
                    {!imageError && (
                      <Image
                        src={profileImage}
                        alt={userDataState?.firstName ? `${userDataState.firstName}'s profile` : 'Profile'}
                        fill
                        sizes="(max-width: 768px) 256px, 288px"
                        priority
                        className="object-cover"
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                      />
                    )}
                    {imageError && (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="text-white text-sm font-medium flex items-center gap-2">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                        Change Photo
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h1 className={`${playfair.className} text-6xl font-normal tracking-tight mb-4 text-white`}>Welcome back, {userDataState?.firstName || 'User'}</h1>
              <div className={inter.className}>
                <p className="text-3xl font-extralight tracking-wide text-[#3B00CC]/65">Matchmaking, Revolutionised</p>
                <div className="space-y-3 mb-8">
                  <div className="h-8"></div>
                </div>

                {/* All Cards Container */}
                <div className="max-w-6xl mx-auto">
                  {/* Two Column Layout for Desktop */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Journey Section */}
                    <div className="space-y-8">
                      {/* Overall Progress Bar */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl text-white">Your Progress</h3>
                          <span className="text-[#3B00CC] text-sm">
                            {userDataState?.questionnaireCompleted ? '3' : '2'} of 6 Steps Complete
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="absolute left-0 top-0 h-full !bg-gradient-to-r !from-[#73FFF6] !to-[#3B00CC]"
                            style={{ width: userDataState?.questionnaireCompleted ? '50%' : '33%' }}
                          />
                        </div>
                      </div>

                      {/* Journey Section */}
                      <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-xl">
                              <svg className="w-5 h-5" fill="none" stroke="#3B00CC" strokeWidth="1.5" strokeOpacity="0.7" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                              </svg>
                            </div>
                            <h3 className="text-xl text-white">Your Journey</h3>
                          </div>
                          
                          {/* Profile Menu */}
                          <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center gap-2 text-white hover:text-white/90 transition-colors">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium" style={{ background: 'rgb(103, 232, 249)' }}>
                                {userDataState?.firstName?.[0]?.toUpperCase() || 'U'}
                              </div>
                            </Menu.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <Menu.Item>
                                  {({ active }: { active: boolean }) => (
                                    <button
                                      onClick={handleSignOut}
                                      className={`${
                                        active ? 'bg-gray-100' : ''
                                      } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                                    >
                                      Sign Out
                                    </button>
                                  )}
                                </Menu.Item>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </div>

                        {/* Journey Steps */}
                        <div className="space-y-1">
                          {/* Profile Created */}
                          <div className="group relative grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-[#3B00CC] flex items-center justify-center mt-1">
                              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg text-white leading-tight group-hover:text-[#3B00CC] transition-colors duration-300">Profile Created</h4>
                              </div>
                              <p className="text-white/70 text-sm mt-0.5">Basic information added</p>
                            </div>
                            <div className="text-white text-sm mt-1 font-medium">Done</div>
                          </div>

                          {/* Connecting Line */}
                          <div className="w-px h-8 bg-white/10 ml-3"></div>

                          {/* Photos Uploaded */}
                          <div className="group relative grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-[#3B00CC] flex items-center justify-center mt-1">
                              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg text-white leading-tight group-hover:text-[#3B00CC] transition-colors duration-300">Photos Uploaded</h4>

                              </div>
                              <p className="text-white/70 text-sm mt-0.5">Profile photos added</p>
                            </div>
                            <div className="text-white text-sm mt-1 font-medium">Done</div>
                          </div>

                          {/* Connecting Line */}
                          <div className="w-px h-8 bg-white/10 ml-3"></div>

                          {/* Questionnaire */}
                          <div onClick={() => router.push('/questionnaire')} className="group relative grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                            <div className={`w-6 h-6 rounded-full ${userDataState?.questionnaireCompleted ? 'bg-[#3B00CC]' : 'bg-white/10'} flex items-center justify-center mt-1`}>
                              {userDataState?.questionnaireCompleted ? (
                                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg text-white leading-tight group-hover:text-[#3B00CC] transition-colors duration-300">Questionnaire</h4>

                              </div>
                              <p className="text-white/70 text-sm mt-0.5">
                                {userDataState?.questionnaireCompleted ? 'All questions answered' : 'Complete your questionnaire'}
                              </p>
                            </div>
                            <div className="text-white text-sm mt-1 font-medium">
                              {userDataState?.questionnaireCompleted ? 'Done' : 'To Do'}
                            </div>
                          </div>

                          {/* Connecting Line */}
                          <div className="w-px h-8 bg-white/10 ml-3"></div>

                          {/* Matching */}
                          <div className="group relative grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mt-1">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg text-white leading-tight group-hover:text-white/80 transition-colors duration-300">Matching</h4>

                              </div>
                              <p className="text-white/70 text-sm mt-0.5">Finding your perfect match</p>
                            </div>
                            <div className="text-white text-sm mt-1">In Progress</div>
                          </div>

                          {/* Connecting Line */}
                          <div className="w-px h-8 bg-white/10 ml-3"></div>

                          {/* Verification */}
                          <div className="group relative grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-1">
                              <div className="w-2 h-2 rounded-full bg-white/80"></div>
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg text-white leading-tight group-hover:text-white/80 transition-colors duration-300">Verification</h4>

                              </div>
                              <p className="text-white/70 text-sm mt-0.5">Identity verification process</p>
                            </div>
                            <div className="text-white text-sm mt-1">Coming Soon</div>
                          </div>

                          {/* Connecting Line */}
                          <div className="w-px h-8 bg-white/10 ml-3"></div>

                          {/* First Connection */}
                          <div className="group relative grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-1">
                              <div className="w-2 h-2 rounded-full bg-white/80"></div>
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg text-white leading-tight group-hover:text-white/80 transition-colors duration-300">First Match</h4>

                              </div>
                              <p className="text-white/70 text-sm mt-0.5">Start your journey</p>
                            </div>
                            <div className="text-white text-sm mt-1">Coming Soon</div>
                          </div>

                          {/* Connecting Line */}
                          <div className="w-px h-8 bg-white/10 ml-3"></div>

                          {/* Next Match */}
                          <div className="group relative grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-1">
                              <div className="w-2 h-2 rounded-full bg-white/80"></div>
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg text-white leading-tight group-hover:text-white/80 transition-colors duration-300">Next Match</h4>

                              </div>
                              <p className="text-white/70 text-sm mt-0.5">Continue your journey</p>
                            </div>
                            <div className="text-white text-sm mt-1">Coming Soon</div>
                          </div>

                          {/* Connecting Line */}
                          <div className="w-px h-8 bg-white/10 ml-3"></div>

                        </div>
                      </div>

                      {/* Tips & Advice Section - Desktop Only */}
                      <div className="mb-8 hidden lg:block">
                        {/* Weekly Tip Button Component */}
                        <WeeklyTipButton
                          tip={tip}
                          hasUserSeen={hasUserSeen}
                          onClick={() => setShowTipModal(true)}
                          loading={tipLoading}
                        />
                      </div>
                    </div>

                    {/* Right Column - Messages, Events, Tips */}
                    <div>
                      {/* Messages Section */}
                      <div className="mb-8">
                        <div className="p-6 rounded-xl backdrop-blur-lg bg-white/5 hover:bg-white/10 shadow-[0_8px_32px_rgb(31,38,135,0.15)] transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-white/10 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                </svg>
                              </div>
                              <h3 className="text-xl text-white">Messages</h3>
                            </div>
                            <div className="text-sm text-white px-2 py-1 bg-white/10 rounded-full">
                              <Link href="/messages" className="text-[#34D8F1]">View All</Link>
                            </div>
                          </div>

                          {/* No Messages State */}
                          <div className="bg-white/10 rounded-xl overflow-hidden">
                            <div className="p-6 flex flex-col items-center text-center">

                              <h4 className="text-xl font-normal text-[#5B3CDD] mb-2">No Messages</h4>
                              <p className="text-white text-base mb-4">Messages will appear here</p>

                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Upcoming Events Section */}
                      <div className="mb-8">
                        <div className="p-6 rounded-xl backdrop-blur-lg bg-white/5 hover:bg-white/10 shadow-[0_8px_32px_rgb(31,38,135,0.15)] transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-white/10 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                              </div>
                              <h3 className="text-xl text-white">Upcoming Events</h3>
                            </div>
                            <div className="text-sm text-white px-2 py-1 bg-white/10 rounded-full">
                              <Link href="/events" className="text-[#34D8F1]">View All</Link>
                            </div>
                          </div>

                          {/* Calendar Component */}
                          <EventCalendar isFullPage={false} />
                        </div>
                      </div>


                    </div>
                  </div>
                </div>

                {/* Tips & Advice Section - Mobile Only */}
                <div className="lg:hidden mb-8 mt-4">
                  {/* Weekly Tip Button Component */}
                  <WeeklyTipButton
                    tip={tip}
                    hasUserSeen={hasUserSeen}
                    onClick={() => setShowTipModal(true)}
                    loading={tipLoading}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation activeTab={activeTab} />

      {/* Right Sidebar - Desktop Only */}
      <aside className="hidden lg:flex flex-col w-24 bg-[#34D8F1]/95 backdrop-blur-xl border-l border-white/10">
        <div className="flex flex-col items-center py-6 h-full">
          <nav className="flex flex-col items-center space-y-6 flex-1">
            {[
              { id: 'dashboard', icon: (
                <svg className="w-6 h-6" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )},
              { id: 'profile', icon: (
                <svg className="w-6 h-6" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )},
              { id: 'messages', icon: (
                <svg className="w-6 h-6" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              )},
              { id: 'matches', icon: (
                <svg className="w-6 h-6" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              )},
              { id: 'settings', icon: (
                <svg className="w-6 h-6" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
              )}
            ].map((item) => (
              <button
                key={item.id}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-white/25 text-white'
                    : 'text-white hover:text-white hover:bg-white/20'
                }`}
                onClick={() => {
                  setActiveTab(item.id);
                  router.push(`/${item.id === 'dashboard' ? '' : item.id}`);
                }}
              >
                {item.icon}
                <span className="text-xs mt-1 capitalize">{item.id}</span>
              </button>
            ))}
          </nav>
          
          {/* Logout Button */}
          <button
            onClick={() => {
              auth.logout().then(() => {
                router.push('/login');
              });
            }}
            className="mt-auto mb-6 flex flex-col items-center p-2 rounded-lg transition-all text-white hover:text-white hover:bg-white/20"
          >
            <svg className="w-6 h-6" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs mt-1">Logout</span>
          </button>
        </div>
      </aside>

      {/* Tip Modal */}
      {showTipModal && tip && (
        <WeeklyTipModal
          tip={tip}
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          onRead={markTipAsSeen}
        />
      )}
    </div>
  );
}
