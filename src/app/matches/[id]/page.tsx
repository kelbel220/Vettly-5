'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, AuthContextType } from '@/context/AuthContext';
import { OrbField } from '@/app/components/gradients/OrbField';
import { HomeOrbField } from '@/app/components/gradients/HomeOrbField';
import { db } from '@/lib/firebase-init';
import { doc, getDoc } from 'firebase/firestore';
import { ProposedMatch, MatchApprovalStatus } from '@/lib/types/matchmaking';
import { useProposedMatches } from '@/hooks/useProposedMatches';
import { useMatchPoints } from '@/hooks/useMatchPoints';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { inter, playfair } from '@/app/fonts';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSmokingRooms } from 'react-icons/md';
import { FaWineGlassAlt, FaChild, FaBabyCarriage } from 'react-icons/fa';
import MatchExplanation from '@/components/matches/MatchExplanation';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';

export default function MatchDetailPage() {
  // Set active tab for navigation
  const activeTab = 'matches';
  const auth = useAuth();
  const params = useParams();
  const router = useRouter();
  const matchId = params?.id as string;
  
  // If no match ID is provided, redirect to matches page
  if (!matchId) {
    router.push('/matches');
    return null;
  }
  
  const { matches, loading, acceptMatch, declineMatch, undoDeclineMatch } = useProposedMatches();
  const [match, setMatch] = useState<ProposedMatch | null>(null);
  const [imageError, setImageError] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  // Use the new hook for match explanation points
  const { 
    pointsData, 
    loading: pointsLoading, 
    error: pointsError, 
    regenerateMatchPoints, 
    isRegenerating,
    getCurrentUserPoints
  } = useMatchPoints(matchId);
  
  useEffect(() => {
    if (!loading && matches.length > 0) {
      const foundMatch = matches.find(m => m.id === matchId);
      if (foundMatch) {
        setMatch(foundMatch);
        
        // Extract photo URL from various possible locations in the data structure
        const extractedPhotoUrl = foundMatch.matchedUserData.profilePhotoUrl || 
                               (foundMatch.matchedUserData.questionnaireAnswers?.personal_profilePhoto) ||
                               null;
        
        console.log('Extracted photo URL:', extractedPhotoUrl);
        setPhotoUrl(extractedPhotoUrl);
        setImageError(false); // Reset image error state when match changes
      } else {
        // Match not found, redirect back to matches page
        router.push('/matches');
      }
    }
  }, [matchId, matches, loading, router]);
  
  // Handle going back
  const handleBack = () => {
    router.back();
  };
  
  // Handle accept match
  const handleAcceptMatch = async () => {
    if (match) {
      await acceptMatch(match.id);
      // Stay on the page to show the updated status
    }
  };
  
  // State for decline modals
  const [showDeclineNotification, setShowDeclineNotification] = useState(false);
  const [showReasonSelection, setShowReasonSelection] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

  // Standard decline reasons
  const standardReasons = [
    "Not physically attracted",
    "Different life goals",
    "Incompatible values",
    "Location is too far"
  ];

  // Handle decline match - show notification first
  const handleDeclineMatch = () => {
    setShowDeclineNotification(true);
  };

  // Handle final decline with reason
  const handleFinalDecline = (reason: string) => {
    if (match) {
      declineMatch(match.id, reason);
      setShowReasonSelection(false);
    }
  };
  
  // The regenerate explanation functionality has been removed
  // Match explanations are now generated automatically when matches are sent from the CRM
  
  if (loading || !match) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0C29] via-[#302B63] to-[#24243E]">
        <div className="absolute inset-0 z-0">
          <OrbField />
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-[0_8px_32px_rgb(31,38,135,0.15)]">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-t-2 border-r-2 border-[#73FFF6] rounded-full animate-spin"></div>
            <p className="text-white">Loading match details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  const {
    matchedUserData,
    compatibilityScore,
    member1Explanation,
    member2Explanation,
    proposedAt,
    status,
    matchingPoints
  } = match;

  // Format the proposed date
  const formattedDate = format(new Date(proposedAt), 'dd MMM yyyy');
  const timeAgo = formatDistanceToNow(new Date(proposedAt), { addSuffix: true });
  
  // Calculate age from DOB if available, otherwise use age field from questionnaireAnswers
  const age = matchedUserData.age || matchedUserData.questionnaireAnswers?.personal_age || 'N/A';
  
  // Get location, state and suburb separately
  const location = matchedUserData.location || '';
  const state = matchedUserData.state || '';
  const suburb = matchedUserData.suburb || '';
  
  // For display purposes, use suburb as location if available
  const displayLocation = suburb || location || 'Location not specified';
  
  // Debug logging
  console.log('Match detail page data:', { 
    matchId: match?.id,
    matchedUserData,
    suburb,
    state,
    profilePhotoUrl: matchedUserData.profilePhotoUrl,
    questionnaireAnswers: matchedUserData.questionnaireAnswers,
    currentPhotoUrl: photoUrl,
    currentUserId: auth.currentUser?.uid,
    member1Id: match.member1Id,
    member2Id: match.member2Id,
    member1Points: match.member1Points ? 'exists' : 'missing',
    member2Points: match.member2Points ? 'exists' : 'missing'
  });
  
  // Format profession
  const profession = matchedUserData.profession || 'Profession not specified';
  
  // Format education level
  const educationLevel = matchedUserData.questionnaireAnswers?.personal_educationLevel || matchedUserData.questionnaireAnswers?.education_level || matchedUserData.educationLevel || 'Not specified';
  
  // Format marital status - use the value directly from matchedUserData
  console.log('Full matchedUserData object:', matchedUserData);
  console.log('Direct maritalStatus:', matchedUserData.maritalStatus);
  console.log('From questionnaire:', matchedUserData.questionnaireAnswers?.personal_maritalStatus);
  
  // Try getting maritalStatus from multiple possible sources
  const maritalStatus = matchedUserData.maritalStatus || 
                       matchedUserData.questionnaireAnswers?.personal_maritalStatus || 
                       'Not specified';
  console.log('Final marital status used:', maritalStatus);
  
  // Format has children
  const hasChildren = matchedUserData.questionnaireAnswers?.personal_hasChildren !== undefined 
    ? matchedUserData.questionnaireAnswers.personal_hasChildren ? 'Has children' : 'No children'
    : 'Not specified';
    
  // Format height
  const height = matchedUserData.questionnaireAnswers?.attraction_height || 'Not specified';

  // Helper function to parse match points from explanation string
  function parseMatchPoints(explanation: string): { header: string; explanation: string }[] {
    if (!explanation) return [];
    
    try {
      // Check if explanation is already in JSON format
      if (explanation.trim().startsWith('[') || explanation.trim().startsWith('{')) {
        const parsed = JSON.parse(explanation);
        
        // Handle array format directly
        if (Array.isArray(parsed)) {
          return parsed;
        }
        
        // Handle object with member1Explanation/member2Explanation
        if (parsed.member1Explanation || parsed.member2Explanation) {
          return parsed.member1Explanation || parsed.member2Explanation || [];
        }
        
        // If it's some other object format, convert to points
        return Object.entries(parsed).map(([key, value]) => ({
          header: key,
          explanation: String(value)
        }));
      }
      
      // Handle plain text format by creating structured points
      // First, try to split by paragraphs
      const paragraphs = explanation
        .split('\n\n')
        .filter(p => p.trim().length > 0);
      
      if (paragraphs.length > 1) {
        // Multiple paragraphs - use first sentence of each as header
        return paragraphs.map(p => {
          const sentences = p.split(/\.\s+/);
          return {
            header: sentences[0].trim().substring(0, 30) + (sentences[0].length > 30 ? '...' : ''),
            explanation: p.trim()
          };
        });
      }
      
      // Try to parse line by line (header: explanation format)
      const lines = explanation
        .split('\n')
        .filter(line => line.trim().length > 0);
      
      if (lines.some(line => line.includes(':'))) {
        return lines
          .filter(line => line.includes(':'))
          .map(line => {
            const [header, ...rest] = line.split(':');
            return {
              header: header.trim(),
              explanation: rest.join(':').trim()
            };
          });
      }
      
      // If all else fails, create a single point with the entire explanation
      return [{
        header: "Why You're Compatible",
        explanation: explanation.trim()
      }];
    } catch (error) {
      console.error('Error parsing match points:', error);
      
      // Fallback to displaying the raw text as a single point
      if (typeof explanation === 'string') {
        return [{
          header: "Why You're Compatible",
          explanation: explanation.trim()
        }];
      }
      
      return [];
    }
  }

  return (
    <div className="h-screen overflow-auto">
      {/* Background container with fixed position to match profile page */}
      <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
        <div className="absolute inset-0 overflow-hidden">
          <OrbField />
        </div>
      </div>
      
      {/* Content - scrollable */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-[1400px] w-full">
        {/* Header with logo and back button */}
        <div className="flex justify-between items-center mb-16 pt-4 relative">
          {/* Back button */}
          <button 
            onClick={handleBack}
            className="flex items-center text-white hover:text-[#73FFF6] transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Matches</span>
          </button>
          
          {/* Vettly Logo in center with proper spacing */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 py-2">
            <Image 
              src="/vettly-logo.png" 
              alt="Vettly Logo" 
              width={160} 
              height={50} 
              className="object-contain" 
            />
          </div>
          
          {/* Empty div to balance the layout */}
          <div className="w-[100px]"></div>
        </div>
        
        {/* Card container - wider for desktop with refined styling */}
        <div className="w-full mx-auto rounded-3xl bg-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgb(31,38,135,0.2)] p-8 md:p-10 mb-6 border border-white/10">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            {/* Left column - Profile photo and basic info - equal width on desktop */}
            <div className="w-full md:w-1/2 flex flex-col gap-6">
              {/* Profile Photo with refined elegant glow */}
              <div className="relative w-full aspect-square">
                {/* Diffused glow layers - more subtle and sophisticated */}
                <div className="absolute -inset-1 rounded-2xl bg-[#73FFF6] blur-[10px] opacity-70 z-5"></div>
                <div className="absolute -inset-3 rounded-3xl bg-[#73FFF6] blur-[20px] opacity-50 animate-pulse z-0"></div>
                <div className="absolute -inset-5 rounded-3xl bg-[#73FFF6] blur-[30px] opacity-30 z-0"></div>
                {/* Refined border */}
                <div className="absolute inset-0 rounded-2xl border border-[#73FFF6]/80 shadow-[0_0_12px_#73FFF6] z-10"></div>
                {/* Content container */}
                <div className="absolute inset-[1px] rounded-2xl overflow-hidden z-20">
                  {/* Display photo if available */}
                  {!imageError && photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={`${matchedUserData.firstName}'s profile`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      onError={() => {
                        console.log('Image error occurred with URL:', photoUrl);
                        setImageError(true);
                      }}
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#2800A3]/30 to-[#34D8F1]/30 flex items-center justify-center">
                      <span className={`${playfair.className} text-5xl text-white/70`}>
                        {matchedUserData.firstName.charAt(0)}
                        {matchedUserData.lastName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Name and Age Heading - more refined and elegant */}
              <div className="mb-6">
                <h2 className={`${playfair.className} text-4xl md:text-5xl font-normal text-white mb-2 tracking-wide`}>
                  {matchedUserData.firstName} {matchedUserData.lastName}, <span className="text-white">{age}</span>
                </h2>
                {/* Location below name */}
                <p className={`${playfair.className} text-white/80 text-xl mb-3 tracking-wide`}>
                  {displayLocation !== 'Location not specified' ? displayLocation : ''}
                  {displayLocation !== 'Location not specified' && state ? ', ' : ''}
                  {state}
                </p>
              </div>
              
              {/* Basic Info Card - Refined Glass Box with elegant glow */}
              <div className="bg-white/8 backdrop-blur-md rounded-2xl p-6 shadow-inner shadow-white/5 border border-[#73FFF6]/30 shadow-[0_0_20px_rgba(115,255,246,0.2)]">
                <h3 className={`${inter.className} text-xl font-semibold text-[#73FFF6] mb-4 border-b border-[#73FFF6]/40 pb-2`}>
                  About
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {/* Location removed - now displayed below name */}
                  
                  {/* Relationship Status - Always visible */}
                  <div className="flex items-center">
                    <div className="p-2 bg-white/10 rounded-lg mr-3 flex justify-center items-center">
                      <svg className="w-5 h-5 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-base font-medium">{maritalStatus}</p>
                    </div>
                  </div>
                  
                  {/* Height */}
                  {height !== 'Not specified' && (
                    <div className="flex items-center">
                      <div className="p-2 bg-white/10 rounded-lg mr-3 flex justify-center items-center">
                        <svg className="w-5 h-5 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-base font-medium">{height}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Profession */}
                  {profession !== 'Profession not specified' && (
                    <div className="flex items-center">
                      <div className="p-2 bg-white/10 rounded-lg mr-3 flex justify-center items-center">
                        <svg className="w-5 h-5 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex items-center">
                        <p className="text-white text-base font-medium">{profession}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Education */}
                  {educationLevel !== 'Not specified' && (
                    <div className="flex items-center">
                      <div className="p-2 bg-white/10 rounded-lg mr-3 flex justify-center items-center">
                        <svg className="w-5 h-5 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-base font-medium">{educationLevel}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Lifestyle - with refined styling */}
              <div className="bg-white/8 backdrop-blur-md rounded-2xl p-6 mt-6 shadow-inner shadow-white/5 border border-[#73FFF6]/30 shadow-[0_0_20px_rgba(115,255,246,0.2)]">
                <h3 className={`${inter.className} text-xl font-semibold text-[#73FFF6] mb-4 border-b border-[#73FFF6]/40 pb-2`}>
                  Lifestyle
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {/* Smoking */}
                  {matchedUserData.questionnaireAnswers?.lifestyle_smoking && (
                    <div className="flex items-center">
                      <div className="p-2 bg-white/10 rounded-lg mr-3">
                        <MdSmokingRooms className="w-5 h-5 text-[#73FFF6]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {matchedUserData.questionnaireAnswers.lifestyle_smoking === "No, and I never have" || 
                           matchedUserData.questionnaireAnswers.lifestyle_smoking === "No" ? 
                           "Non Smoker" : "Smoker"}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Drinking */}
                  {matchedUserData.questionnaireAnswers?.lifestyle_alcohol && (
                    <div className="flex items-center">
                      <div className="p-2 bg-white/10 rounded-lg mr-3">
                        <FaWineGlassAlt className="w-5 h-5 text-[#73FFF6]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {matchedUserData.questionnaireAnswers.lifestyle_alcohol === "No" ? 
                           "Non Drinker" : 
                           matchedUserData.questionnaireAnswers.lifestyle_alcohol === "Socially (e.g., on weekends or with friends)" ? 
                           "Social Drinker" : 
                           matchedUserData.questionnaireAnswers.lifestyle_alcohol === "Occasionally" ? 
                           "Occasional Drinker" : 
                           matchedUserData.questionnaireAnswers.lifestyle_alcohol === "Regularly" ? 
                           "Regular Drinker" : 
                           matchedUserData.questionnaireAnswers.lifestyle_alcohol}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Has Children */}
                  <div className="flex items-center">
                    <div className="p-2 bg-white/10 rounded-lg mr-3">
                      <FaBabyCarriage className="w-5 h-5 text-[#73FFF6]" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {matchedUserData.questionnaireAnswers?.personal_hasChildren ? 
                          matchedUserData.questionnaireAnswers?.personal_childrenAges ? 
                          `Has Children (${matchedUserData.questionnaireAnswers.personal_childrenAges})` : 
                          "Has Children" : 
                          "No Children"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Children Preference */}
                  {matchedUserData.questionnaireAnswers?.relationships_children && (
                    <div className="flex items-center">
                      <div className="p-2 bg-white/10 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {matchedUserData.questionnaireAnswers.relationships_children === "Yes" ? 
                            "Open to Children" : "Not Open to Children"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Hobbies */}
                {matchedUserData.questionnaireAnswers?.lifestyle_hobbiesTypes && (
                  <div className="mt-8">
                    <p className="text-white/80 text-sm mb-3 uppercase tracking-wider font-medium">Hobbies & Interests</p>
                    <div className="flex flex-wrap gap-3">
                      {Array.isArray(matchedUserData.questionnaireAnswers.lifestyle_hobbiesTypes) ? 
                        matchedUserData.questionnaireAnswers.lifestyle_hobbiesTypes.map((hobby: string, index: number) => (
                          <span 
                            key={index} 
                            className="bg-[#34D8F1]/20 backdrop-blur-md border border-[#34D8F1]/40 rounded-full px-4 py-1.5 text-white text-sm font-medium shadow-sm hover:bg-[#34D8F1]/30 transition-colors"
                          >
                            {hobby}
                          </span>
                        )) : 
                        <span className="text-white/50">No hobbies specified</span>
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right column - Match details - equal width on desktop */}
            <div className="w-full md:w-1/2">
              {/* Status Pills */}
              <div className="mb-0">
                <div className="flex flex-wrap gap-3">
                  {/* Match Status Pill */}
                  {status && (
                    <div className={`backdrop-blur-md border rounded-full px-3 py-1 text-white text-sm font-medium shadow-sm ${status === MatchApprovalStatus.APPROVED ? 'bg-green-500/30 border-green-500/50' : status === MatchApprovalStatus.DECLINED ? 'bg-red-500/30 border-red-500/50' : 'bg-[#34D8F1]/30 border-[#34D8F1]/50'}`}>
                      {status === MatchApprovalStatus.APPROVED ? 'Match Approved' : status === MatchApprovalStatus.DECLINED ? 'Match Declined' : 'Pending'}
                    </div>
                  )}
                  
                  {/* Undo Decline Button - Always visible */}
                  <button
                    onClick={() => {
                      if (match) {
                        undoDeclineMatch(match.id);
                      }
                    }}
                    className="bg-white/10 backdrop-blur-md border border-white/30 rounded-full px-3 py-1 text-white text-sm font-medium shadow-sm hover:bg-white/20 transition-colors"
                  >
                    Undo Decline (Testing)
                  </button>
                  
                  {hasChildren !== 'Not specified' && (
                    <div className="bg-[#34D8F1]/30 backdrop-blur-md border border-[#34D8F1]/50 rounded-full px-3 py-1 text-white text-sm font-medium shadow-sm">
                      {hasChildren}
                    </div>
                  )}

                </div>
              </div>
              
              {/* Why you're a great match - with border glow */}
              <div className="relative mb-4 mt-0">
                {/* Glass box matching About section with brighter and stronger glow */}
                <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-7 shadow-inner shadow-white/10 border-[1.5px] border-[#73FFF6]/80" style={{ boxShadow: '0 0 15px 5px rgba(115,255,246,0.7), 0 0 30px 15px rgba(115,255,246,0.4), 0 0 60px 25px rgba(115,255,246,0.2), inset 0 0 8px rgba(255,255,255,0.1)' }}>
                  <div className="mb-5">
                    <h3 className={`${playfair.className} text-3xl font-medium text-[#73FFF6] tracking-wide border-b border-[#73FFF6]/40 pb-2`}>
                      Why you're a great match
                    </h3>
                  </div>
                                    {/* Display gender-specific explanation using the new useMatchPoints hook */}
                  {(() => {
                    // If loading, show loading state
                    if (pointsLoading) {
                      return (
                        <div className="text-white/70 italic text-sm">
                          Loading match explanation...
                        </div>
                      );
                    }
                    
                    // If there's an error, show error message
                    if (pointsError) {
                      return (
                        <div className="text-red-400 italic text-sm">
                          Unable to load match explanation. Please try again later.
                        </div>
                      );
                    }
                    
                    // Get points for the current user
                    const userPoints = getCurrentUserPoints();
                    
                    // If we have points, show them
                    if (userPoints && userPoints.length > 0) {
                      return <MatchExplanation matchPoints={userPoints} />;
                    }
                    
                    // No points available - this happens when match was sent without generating points
                    return (
                      <div className="text-white/70 text-sm">
                        <p className="mb-2">Your match explanation is not available at this time.</p>
                        <p>This match may have been created before explanations were added to the system.</p>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Photo Grid - Three photos in horizontal layout */}
                <div className="mt-8">
                  <h4 className="text-white/80 text-sm mb-4 uppercase tracking-wider font-medium">Photo Gallery</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Photo 1 */}
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-[#34D8F1]/30 to-[#73FFF6]/30 border border-[#34D8F1]/20">
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white/70 text-xs">Photo 1</span>
                      </div>
                    </div>
                    
                    {/* Photo 2 */}
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-[#34D8F1]/30 to-[#73FFF6]/30 border border-[#34D8F1]/20">
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white/70 text-xs">Photo 2</span>
                      </div>
                    </div>
                    
                    {/* Photo 3 */}
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-[#34D8F1]/30 to-[#73FFF6]/30 border border-[#34D8F1]/20">
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white/70 text-xs">Photo 3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Date info */}
              <div className="mt-6 mb-4">
                <div className="text-white/50 text-sm">
                  <span>Proposed {timeAgo} • {formattedDate}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-center md:justify-start mb-2">
                {status === MatchApprovalStatus.PENDING && (
                  <div className="flex gap-4 w-full md:w-auto">
                    <button
                      onClick={handleDeclineMatch}
                      className="flex-1 md:w-[160px] px-6 py-3 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={handleAcceptMatch}
                      className="flex-1 md:w-[160px] px-8 py-3 rounded-lg text-white bg-[#3B00CC] hover:opacity-90 transition-opacity"
                    >
                      Accept Match
                    </button>
                  </div>
                )}
                
                {status === MatchApprovalStatus.APPROVED && (
                  <div className="bg-green-400/20 text-green-300 px-4 py-2 rounded-full text-sm">
                    Match Accepted
                  </div>
                )}
                
                {status === MatchApprovalStatus.DECLINED && (
                  <div className="bg-red-400/20 text-red-300 px-4 py-2 rounded-full text-sm">
                    Match Declined
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Navigation - Right Sidebar */}
      <aside className="hidden lg:flex flex-col w-24 bg-[#34D8F1]/95 backdrop-blur-xl border-l border-white/10 fixed right-0 top-0 h-full">
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
              const auth = useAuth();
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
      
      {/* Mobile Navigation */}
      <MobileNavigation activeTab={activeTab} />
      
      {/* Decline Confirmation Notification - Step 1 */}
      <AnimatePresence>
        {showDeclineNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-xl">
              <h3 className={`${playfair.className} text-2xl font-normal text-white mb-4`}>
                Are you sure?
              </h3>
              <div className="space-y-4 mb-6">
                <p className={`${inter.className} text-white/90 mb-2`}>
                  You only have 3 matches proposed. Once declined, this match won't be proposed again.
                </p>
                <p className={`${inter.className} text-white/80 text-sm`}>
                  Unlike standard dating apps, we've carefully assessed many options and strongly believe this is a good match for you based on compatibility factors.
                </p>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeclineNotification(false)}
                  className="px-4 py-2 border border-white/20 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeclineNotification(false);
                    setShowReasonSelection(true);
                  }}
                  className="px-6 py-2 rounded-lg text-white bg-red-500/80 hover:bg-red-500/90 transition-colors"
                >
                  Decline Anyway
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Reason Selection - Step 2 */}
      <AnimatePresence>
        {showReasonSelection && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-xl">
              <h3 className={`${playfair.className} text-2xl font-normal text-white mb-4`}>
                Why are you declining this match?
              </h3>
              <div className="space-y-4 mb-6">
                <p className={`${inter.className} text-white/90 mb-4`}>
                  Your feedback helps us improve future matches.
                </p>
                
                {/* Standard reasons */}
                <div className="space-y-3">
                  {standardReasons.map((reason, index) => (
                    <div 
                      key={index}
                      onClick={() => setSelectedReason(reason)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedReason === reason ? 'bg-white/20 border border-white/30' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}
                    >
                      <p className="text-white">{reason}</p>
                    </div>
                  ))}
                  
                  {/* Custom reason option */}
                  <div 
                    className={`p-3 rounded-lg transition-colors ${selectedReason === 'other' ? 'bg-white/20 border border-white/30' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}
                  >
                    <div 
                      onClick={() => setSelectedReason('other')}
                      className="flex items-center cursor-pointer"
                    >
                      <p className="text-white">Other reason</p>
                    </div>
                    
                    {selectedReason === 'other' && (
                      <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Please specify..."
                        className="mt-2 w-full bg-white/10 border border-white/20 rounded-md p-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                        rows={3}
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowReasonSelection(false);
                    setShowDeclineNotification(true);
                  }}
                  className="px-4 py-2 border border-white/20 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    const finalReason = selectedReason === 'other' ? customReason : selectedReason;
                    handleFinalDecline(finalReason);
                  }}
                  className="px-6 py-2 rounded-lg text-white bg-red-500/80 hover:bg-red-500/90 transition-colors"
                  disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim())}
                >
                  Submit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
