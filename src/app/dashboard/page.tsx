'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { OrbField } from '../components/gradients/OrbField';
import { AnimatedText } from '../components/text/AnimatedText';
import { useWeeklyTip } from '@/hooks/useWeeklyTip';
import { WeeklyTipButton } from '@/components/tips/WeeklyTipButton';
import { format } from 'date-fns';
import Image from 'next/image';
import { inter, playfair } from '../fonts';
import { useAuth, AuthContextType } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useRouter } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';

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
}

export default function Dashboard() {
  const auth: AuthContextType = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userDataState, setUserData] = useState<UserData | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileImage, setProfileImage] = useState('/placeholder-profile.jpg');
  
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
    console.log('Dashboard mounted, refreshing weekly tip');
    refreshTip();
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
                          <span className="text-[#3B00CC] text-sm">3 of 6 Steps Complete</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="absolute left-0 top-0 h-full !bg-gradient-to-r !from-[#73FFF6] !to-[#3B00CC]"
                            style={{ width: '50%' }}
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
                                {/* Help Icon */}
                                <button className="group-hover:opacity-100 opacity-0 transition-opacity" title="Your basic profile information helps us understand who you are">
                                  <svg className="w-4 h-4 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                  </svg>
                                </button>
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
                                {/* Help Icon */}
                                <button className="group-hover:opacity-100 opacity-0 transition-opacity" title="Photos increase your match rate by 80%">
                                  <svg className="w-4 h-4 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                  </svg>
                                </button>
                              </div>
                              <p className="text-white/70 text-sm mt-0.5">Profile photos added</p>
                            </div>
                            <div className="text-white text-sm mt-1 font-medium">Done</div>
                          </div>

                          {/* Connecting Line */}
                          <div className="w-px h-8 bg-white/10 ml-3"></div>

                          {/* Questionnaire */}
                          <div onClick={() => router.push('/questionnaire')} className="group relative grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                            <div className="w-6 h-6 rounded-full bg-[#3B00CC] flex items-center justify-center mt-1">
                              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg text-white leading-tight group-hover:text-[#3B00CC] transition-colors duration-300">Questionnaire</h4>
                                {/* Help Icon */}
                                <button className="group-hover:opacity-100 opacity-0 transition-opacity" title="Help us understand your preferences (Est. 5 mins)">
                                  <svg className="w-4 h-4 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                  </svg>
                                </button>
                              </div>
                              <p className="text-white/70 text-sm mt-0.5">All questions answered</p>
                            </div>
                            <div className="text-white text-sm mt-1 font-medium">Done</div>
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
                                {/* Help Icon */}
                                <button className="group-hover:opacity-100 opacity-0 transition-opacity" title="Our AI is finding your perfect match">
                                  <svg className="w-4 h-4 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                  </svg>
                                </button>
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
                                {/* Help Icon */}
                                <button className="group-hover:opacity-100 opacity-0 transition-opacity" title="Verify your identity to ensure safety and trust">
                                  <svg className="w-4 h-4 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                  </svg>
                                </button>
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
                                <h4 className="text-lg text-white leading-tight group-hover:text-white/80 transition-colors duration-300">First Connection</h4>
                                {/* Help Icon */}
                                <button className="group-hover:opacity-100 opacity-0 transition-opacity" title="Get ready to meet your match!">
                                  <svg className="w-4 h-4 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                  </svg>
                                </button>
                              </div>
                              <p className="text-white/70 text-sm mt-0.5">Start your journey</p>
                            </div>
                            <div className="text-white text-sm mt-1">Coming Soon</div>
                          </div>

                          {/* Connecting Line */}
                          <div className="w-px h-8 bg-white/10 ml-3"></div>

                        </div>
                      </div>
                    </div>

                    {/* Right Column - Messages, Events, Tips */}
                    <div>
                      {/* Tips & Advice Section */}
                      <div className="mb-8">
                        {/* Weekly Tip Button Component */}
                        <WeeklyTipButton
                          tip={tip}
                          hasUserSeen={hasUserSeen}
                          onClick={() => setShowTipModal(true)}
                          loading={tipLoading}
                        />
                      </div>
                      
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
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                              </div>
                              <h3 className="text-xl text-white">Upcoming Events</h3>
                            </div>
                            <div className="text-sm text-white px-2 py-1 bg-white/10 rounded-full">
                              <Link href="/events" className="text-[#34D8F1]">View All</Link>
                            </div>
                          </div>

                          {/* No Events State */}
                          <div className="bg-white/10 rounded-xl overflow-hidden">
                            <div className="p-6 flex flex-col items-center text-center">

                              <h4 className="text-xl font-normal text-[#5B3CDD] mb-2">No Events</h4>
                              <p className="text-white text-base mb-4">Events will appear here</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-center py-2 px-4 bg-[#34D8F1]/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex gap-10">
          {[
            { id: 'dashboard', icon: (
              <svg className="w-6 h-6" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
              className={`p-2 rounded-lg transition-all ${
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
            </button>
          ))}
        </div>
      </div>

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
        </div>
      </aside>

      {/* Tip Modal */}
      {showTipModal && tip && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-gradient-to-br from-[#4FB8E7] via-[#3373C4] to-[#2D0F63] rounded-3xl w-full max-w-3xl overflow-hidden border border-white/20 shadow-2xl">
            {/* Modal Header */}
            <div className="relative px-8 pt-8 pb-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#00FFFF]/20 flex items-center justify-center border border-[#00FFFF]/40">
                  {/* Icon based on tip category */}
                  {tip.category === 'profile_improvement' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  )}
                  {tip.category === 'conversation_starters' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  )}
                  {tip.category === 'date_ideas' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  )}
                  {tip.category === 'relationship_advice' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  )}
                  {tip.category === 'matchmaking_insights' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
                      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
                    </svg>
                  )}
                  {tip.category === 'self_improvement' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-[#00FFFF] text-xs uppercase tracking-widest font-inter font-medium">Weekly Insight</p>
                  <h4 className={`${playfair.className} text-3xl font-bold text-white leading-tight`}>{tip.title}</h4>
                </div>
              </div>
              <button 
                onClick={() => {
                  markTipAsSeen();
                  setShowTipModal(false);
                }}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            {/* Date indicator */}
            <div className="px-8 pb-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 mr-2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p className="text-white/40 text-sm font-inter">
                  {tip.publishedAt 
                    ? (() => {
                        try {
                          const publishedAt = tip.publishedAt as any;
                          
                          if (typeof publishedAt === 'object' && publishedAt !== null) {
                            if (publishedAt.toDate && typeof publishedAt.toDate === 'function') {
                              // Firestore Timestamp object
                              return format(publishedAt.toDate(), 'MMMM d, yyyy');
                            } else if (publishedAt.seconds && typeof publishedAt.seconds === 'number') {
                              // Timestamp-like object with seconds
                              return format(new Date(publishedAt.seconds * 1000), 'MMMM d, yyyy');
                            }
                          }
                          // Regular date string or timestamp
                          return format(new Date(publishedAt), 'MMMM d, yyyy');
                        } catch (error) {
                          console.error('Error formatting date:', error);
                          return format(new Date(), 'MMMM d, yyyy');
                        }
                      })()
                    : format(new Date(), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            
            {/* Main Content */}
            <div className="px-8 py-6">
              <div className="text-white/90 max-w-none font-inter space-y-6">
                <p className="text-lg leading-relaxed">
                  {tip.shortDescription || tip.content?.substring(0, 150)}
                </p>
                
                {/* Main Content */}
                {tip.content && (
                  <div className="pt-4">
                    <div>
                      <p className="text-base leading-relaxed whitespace-pre-line">
                        {tip.content}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Why This Matters Section - Optional section if needed */}
                <div className="pt-4">
                  <h5 className={`${playfair.className} text-xl font-semibold mb-3 text-white`}>
                    Why This Matters
                  </h5>
                  <div>
                    <p className="text-base leading-relaxed">
                      {tip.content && tip.content.length > 150 ? 
                        tip.content.substring(0, 150) + "..." : 
                        "Complete your profile to make meaningful connections and find your perfect match."}
                    </p>
                  </div>
                </div>
                
                {/* Quick Tips Section */}
                {tip.quickTips && tip.quickTips.length > 0 && (
                  <div className="pt-4">
                    <h5 className={`${playfair.className} text-xl font-semibold mb-3 text-white`}>
                      Quick Tips
                    </h5>
                    <ul className="space-y-2 text-base">
                      {tip.quickTips.map((tipItem, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-[#00FFFF] mr-2">•</span>
                          <span>{tipItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Did You Know Section */}
                {tip.didYouKnow && (
                  <div className="pt-4">
                    <h5 className={`${playfair.className} text-xl font-semibold mb-3 text-white`}>
                      Did You Know?
                    </h5>
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                      <p className="text-base leading-relaxed">
                        {tip.didYouKnow}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* This Week's Challenge Section */}
                {tip.weeklyChallenge && (
                  <div className="mt-8 bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                    <h5 className={`${playfair.className} text-xl font-semibold mb-3 text-white`}>This Week's Challenge</h5>
                    <p className="text-base leading-relaxed">
                      {tip.weeklyChallenge}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Action Button */}
              <div className="mt-10 mb-2 flex justify-center">
                <button 
                  onClick={() => {
                    markTipAsSeen();
                    setShowTipModal(false);
                  }}
                  className="bg-gradient-to-r from-[#00FFFF]/30 to-[#4FB8E7]/30 hover:from-[#00FFFF]/40 hover:to-[#4FB8E7]/40 backdrop-blur-sm text-white px-10 py-3 rounded-full transition-all text-base font-medium tracking-wide border border-[#00FFFF]/30 shadow-lg"
                >
                  I Get It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
