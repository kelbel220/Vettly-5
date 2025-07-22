'use client';

import React from 'react';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { ProposedMatch, MatchApprovalStatus } from '@/lib/types/matchmaking';
import { inter, playfair } from '@/app/fonts';

interface ProposedMatchCardProps {
  match: ProposedMatch;
  onAccept: (matchId: string) => void;
  onDecline: (matchId: string) => void;
}

export const ProposedMatchCard: React.FC<ProposedMatchCardProps> = ({
  match,
  onAccept,
  onDecline
}) => {
  const {
    id,
    matchedUserData,
    compatibilityScore,
    compatibilityExplanation,
    proposedAt,
    status
  } = match;

  // Format the proposed date
  const formattedDate = format(new Date(proposedAt), 'dd MMM yyyy');
  const timeAgo = formatDistanceToNow(new Date(proposedAt), { addSuffix: true });
  
  // Calculate age from DOB if available, otherwise use age field
  const age = matchedUserData.age || 'N/A';
  
  // Get raw location and state data
  const suburb = matchedUserData.location || '';
  const state = matchedUserData.state || '';
  
  // Debug logging
  console.log('ProposedMatchCard data:', { 
    matchId: id,
    location: matchedUserData.location,
    stateFromData: matchedUserData.state,
    suburb,
    formattedState: state,
    matchedUserData
  });
  
  // Format profession
  const profession = matchedUserData.profession || 'Profession not specified';
  
  // Format education level
  const educationLevel = matchedUserData.educationLevel || '';
  
  // Handle image error
  const [imageError, setImageError] = React.useState(false);
  
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 hover:bg-white/20">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Photo */}
        <div className="w-full md:w-1/3 flex-shrink-0">
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
                <span className={`${playfair.className} text-4xl text-white/70`}>
                  {matchedUserData.firstName.charAt(0)}
                  {matchedUserData.lastName.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Match Details */}
        <div className="flex-1">
          {/* Header with Name and Compatibility */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h3 className={`${playfair.className} text-2xl font-normal text-white`}>
              {matchedUserData.firstName} {matchedUserData.lastName}
            </h3>
          </div>
          
          {/* Basic Info */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 mb-4">
            <h4 className={`${inter.className} text-xl font-medium text-[#73FFF6] mb-2`}>
              About
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center text-white/70">
              <svg className="w-4 h-4 mr-2 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{age} years</span>
            </div>
            <div className="flex items-center text-white/70">
              <svg className="w-4 h-4 mr-2 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                {suburb && suburb}
                {suburb && state && ', '}
                {state && state}
              </span>
            </div>
            <div className="flex items-center text-white/70">
              <svg className="w-4 h-4 mr-2 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{profession}</span>
            </div>
            <div className="flex items-center text-white/70">
              <svg className="w-4 h-4 mr-2 text-[#73FFF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{educationLevel}</span>
            </div>

            </div>
          </div>
          
          {/* Compatibility Explanation */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 mb-4">
            <h4 className={`${inter.className} text-sm font-medium text-[#73FFF6] mb-2`}>
              Why You're Compatible
            </h4>
            <p className={`${inter.className} text-white/80 text-sm`}>
              {compatibilityExplanation}
            </p>
          </div>
          
          {/* Footer with Date and Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="text-white/50 text-xs mb-4 md:mb-0">
              <span>Proposed {timeAgo} • {formattedDate}</span>
            </div>
            
            {status === MatchApprovalStatus.PENDING && (
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => onDecline(id)}
                  className="flex-1 md:flex-none px-4 py-2 border border-white/20 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => onAccept(id)}
                  className="flex-1 md:flex-none px-6 py-2 rounded-lg text-white bg-gradient-to-r from-[#73FFF6] to-[#3B00CC] hover:opacity-90 transition-opacity"
                >
                  Accept Match
                </button>
              </div>
            )}
            
            {status === MatchApprovalStatus.APPROVED && (
              <div className="bg-green-400/20 text-green-300 px-3 py-1 rounded-full text-sm">
                Match Accepted
              </div>
            )}
            
            {status === MatchApprovalStatus.DECLINED && (
              <div className="bg-red-400/20 text-red-300 px-3 py-1 rounded-full text-sm">
                Match Declined
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
