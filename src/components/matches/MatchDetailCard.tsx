'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { ProposedMatch, MatchApprovalStatus } from '@/lib/types/matchmaking';
import { inter, playfair } from '@/app/fonts';
import { OrbField } from '@/app/components/gradients/OrbField';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchDetailCardProps {
  match: ProposedMatch;
  onAccept: (matchId: string) => void;
  onDecline: (matchId: string, reason?: string) => void;
  onUndoDecline?: (matchId: string) => void; // Optional prop for undoing declined matches
  onClose: () => void;
}

export const MatchDetailCard: React.FC<MatchDetailCardProps> = ({
  match,
  onAccept,
  onDecline,
  onUndoDecline,
  onClose
}) => {
  // State for showing decline confirmation notification and reason selection
  const [showDeclineNotification, setShowDeclineNotification] = useState(false);
  const [showReasonSelection, setShowReasonSelection] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  
  // Standard decline reasons
  const standardReasons = [
    "Not physically attracted",
    "Different life goals",
    "Location too far",
    "Incompatible values"
  ];
  const {
    id,
    matchedUserData,
    compatibilityScore,
    compatibilityExplanation,
    proposedAt,
    status,
    matchingPoints
  } = match;

  // Format the proposed date
  const formattedDate = format(new Date(proposedAt), 'dd MMM yyyy');
  const timeAgo = formatDistanceToNow(new Date(proposedAt), { addSuffix: true });
  
  // Calculate age from DOB if available, otherwise use age field
  const age = matchedUserData.age || 'N/A';
  
  // Format location, state and suburb
  const location = matchedUserData.location || '';
  const state = matchedUserData.state || '';
  const suburb = matchedUserData.suburb || '';
  
  // For display purposes, use suburb as location if available
  const displayLocation = suburb || location || 'Location not specified';
  
  // Log full matchedUserData for debugging
  console.log('Full matchedUserData:', matchedUserData);
  
  // Log location data for debugging
  console.log('Location data:', { 
    displayLocation,
    location, 
    state, 
    suburb,
    rawData: { 
      location: matchedUserData.location,
      state: matchedUserData.state,
      suburb: matchedUserData.suburb 
    }
  });
  
  // Check if state is in questionnaireAnswers
  if (matchedUserData.questionnaireAnswers) {
    console.log('Questionnaire answers keys:', Object.keys(matchedUserData.questionnaireAnswers));
    if (matchedUserData.questionnaireAnswers.personal_state) {
      console.log('Found state in questionnaireAnswers.personal_state:', matchedUserData.questionnaireAnswers.personal_state);
    }
  }
  
  // Format profession
  const profession = matchedUserData.profession || 'Profession not specified';
  
  // Handle image error
  const [imageError, setImageError] = useState(false);
  
  // Format education level
  const educationLevel = matchedUserData.questionnaireAnswers?.education_level || 'Not specified';
  
  // Format marital status
  const maritalStatus = matchedUserData.questionnaireAnswers?.personal_maritalStatus || 'Not specified';
  
  // Format children status
  const hasChildren = matchedUserData.questionnaireAnswers?.personal_hasChildren !== undefined 
    ? matchedUserData.questionnaireAnswers.personal_hasChildren ? 'Has children' : 'No children'
    : 'Not specified';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
        {/* Background overlay with orbs */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F0C29] via-[#302B63] to-[#24243E] overflow-hidden">
          <OrbField />
        </div>
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Card container */}
        <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white/10 backdrop-blur-lg shadow-[0_8px_32px_rgb(31,38,135,0.15)] p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
          {/* Left column - Profile photo and basic info */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            {/* Profile Photo */}
            <div className="relative w-full aspect-square rounded-xl overflow-hidden">
              {!imageError && matchedUserData.profilePhotoUrl ? (
                <Image
                  src={matchedUserData.profilePhotoUrl}
                  alt={`${matchedUserData.firstName}'s profile`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  onError={() => setImageError(true)}
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
            
            {/* Compatibility Score */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className={`${inter.className} text-sm font-medium text-white/80`}>
                  Compatibility
                </h4>
                <div className="text-[#73FFF6] font-bold text-2xl">
                  {compatibilityScore}%
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full bg-gradient-to-r from-[#73FFF6] to-[#3B00CC]" 
                  style={{ width: `${compatibilityScore}%` }}
                ></div>
              </div>
            </div>
            
            {/* Basic Info Cards */}
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4">
                <div className="flex items-center text-white/70 mb-2">
                  <svg className="w-5 h-5 mr-2 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium">Location</span>
                </div>
                <p className="text-white text-base pl-7">
                  {displayLocation !== 'Location not specified' ? displayLocation : ''}
                  {displayLocation !== 'Location not specified' && state ? ', ' : ''}
                  {state}
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4">
                <div className="flex items-center text-white/70 mb-2">
                  <svg className="w-5 h-5 mr-2 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Profession</span>
                </div>
                <p className="text-white text-base pl-7">{profession}</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4">
                <div className="flex items-center text-white/70 mb-2">
                  <svg className="w-5 h-5 mr-2 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-sm font-medium">Education</span>
                </div>
                <p className="text-white text-base pl-7">{educationLevel}</p>
              </div>
            </div>
          </div>
          
          {/* Right column - Match details */}
          <div className="flex-1">
            {/* Header with Name and Age */}
            <div className="mb-6">
              <h2 className={`${playfair.className} text-3xl md:text-4xl font-normal text-white mb-2`}>
                {matchedUserData.firstName} {matchedUserData.lastName}, {age}
              </h2>
              <div className="flex flex-wrap gap-3">
                <div className="bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-white/80 text-sm">
                  {maritalStatus}
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-white/80 text-sm">
                  {hasChildren}
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-white/80 text-sm">
                  {educationLevel}
                </div>
              </div>
            </div>
            
            {/* Compatibility explanation section */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 mb-6">
              <h3 className={`${playfair.className} text-2xl font-medium text-[#73FFF6] mb-6`}>
                Why you're a great match
              </h3>
              <p className={`${inter.className} text-white/90 text-sm mb-4`}>
                {compatibilityExplanation}
              </p>
              
              {/* Matching Points */}
              {matchingPoints && matchingPoints.length > 0 && (
                <div className="mt-4 space-y-3">
                  {matchingPoints.map((point, index) => (
                    <div key={index} className="flex items-start">
                      <div className="mt-1 mr-3 text-[#73FFF6]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white/90">{point.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Lifestyle & Interests */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 mb-6">
              <h3 className={`${inter.className} text-xl font-medium text-[#73FFF6] mb-4`}>
                Lifestyle & Interests
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Smoking */}
                <div className="flex items-center">
                  <div className="p-2 bg-white/10 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Smoking</p>
                    <p className="text-white">
                      {matchedUserData.questionnaireAnswers?.lifestyle_smoking || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                {/* Drinking */}
                <div className="flex items-center">
                  <div className="p-2 bg-white/10 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Drinking</p>
                    <p className="text-white">
                      {matchedUserData.questionnaireAnswers?.lifestyle_alcohol || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                {/* Height */}
                <div className="flex items-center">
                  <div className="p-2 bg-white/10 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Height</p>
                    <p className="text-white">
                      {matchedUserData.questionnaireAnswers?.attraction_height || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                {/* Children Preference */}
                <div className="flex items-center">
                  <div className="p-2 bg-white/10 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Children Preference</p>
                    <p className="text-white">
                      {matchedUserData.questionnaireAnswers?.relationships_children || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Hobbies */}
              {matchedUserData.questionnaireAnswers?.lifestyle_hobbiesTypes && (
                <div className="mt-6">
                  <p className="text-white/70 text-sm mb-2">Hobbies & Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(matchedUserData.questionnaireAnswers.lifestyle_hobbiesTypes) ? 
                      matchedUserData.questionnaireAnswers.lifestyle_hobbiesTypes.map((hobby: string, index: number) => (
                        <span 
                          key={index} 
                          className="bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-white/80 text-sm"
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
            
            {/* Footer with Date and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8">
              <div className="text-white/50 text-sm mb-4 md:mb-0">
                <span>Proposed {timeAgo} • {formattedDate}</span>
              </div>
              
              {status === MatchApprovalStatus.PENDING && (
                <div className="flex gap-4 w-full md:w-auto">
                  <button
                    onClick={() => setShowDeclineNotification(true)}
                    className="flex-1 md:flex-none px-6 py-3 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => onAccept(id)}
                    className="flex-1 md:flex-none px-8 py-3 rounded-lg text-white bg-gradient-to-r from-[#73FFF6] to-[#3B00CC] hover:opacity-90 transition-opacity"
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
                <div className="flex items-center gap-3">
                  <div className="bg-red-400/20 text-red-300 px-4 py-2 rounded-full text-sm">
                    Match Declined
                  </div>
                  {onUndoDecline && (
                    <button
                      onClick={() => onUndoDecline(id)}
                      className="px-4 py-2 border border-white/20 rounded-lg text-white/70 hover:bg-white/10 transition-colors text-sm"
                    >
                      Undo (Testing)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
      
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
                    onDecline(id, finalReason);
                    setShowReasonSelection(false);
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
    </>
  );
};
