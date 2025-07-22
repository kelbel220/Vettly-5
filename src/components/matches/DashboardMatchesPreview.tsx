'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProposedMatch, MatchApprovalStatus } from '@/lib/types/matchmaking';
import { inter, playfair } from '@/app/fonts';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';


interface DashboardMatchesPreviewProps {
  matches: ProposedMatch[];
  isLoading: boolean;
}

export const DashboardMatchesPreview: React.FC<DashboardMatchesPreviewProps> = ({
  matches,
  isLoading
}) => {
  const router = useRouter();
  
  console.log('DashboardMatchesPreview - matches received:', matches);
  console.log('DashboardMatchesPreview - isLoading:', isLoading);
  console.log('DashboardMatchesPreview - matches types:', matches.map(match => typeof match));
  console.log('DashboardMatchesPreview - matches statuses:', matches.map(match => match.status));
  
  // Clean up debug logs
  console.log('DashboardMatchesPreview - matches count:', matches.length);
  
  // Check if matches array is valid
  if (!Array.isArray(matches)) {
    console.error('DashboardMatchesPreview - matches is not an array!');
    return null;
  }
  
  // Log each match in detail
  matches.forEach((match, index) => {
    console.log(`Match ${index}:`, {
      id: match.id,
      status: match.status,
      matchedUserId: match.matchedUserId,
      matchedUserData: match.matchedUserData,
      proposedAt: match.proposedAt
    });
  });
  


  // Force cast all matches to have the correct status type and ensure location data is properly formatted
  const typedMatches = matches.map(match => {
    // Convert string status to enum if needed
    let status = match.status;
    if (typeof status === 'string') {
      if (status === 'pending') status = MatchApprovalStatus.PENDING;
      else if (status === 'approved') status = MatchApprovalStatus.APPROVED;
      else if (status === 'declined') status = MatchApprovalStatus.DECLINED;
      else if (status === 'expired') status = MatchApprovalStatus.EXPIRED;
    }
    
    return {
      ...match,
      status
    };
  });
  
  // For debugging, show all matches instead of just pending ones
  const pendingMatches = typedMatches;
  console.log('Showing all matches for debugging:', pendingMatches);
  console.log('DashboardMatchesPreview - pendingMatches:', pendingMatches);
  
  // Show at most 3 pending matches in the preview
  const displayMatches = pendingMatches.slice(0, 3);
  
  const navigateToMatches = () => {
    router.push('/matches');
  };
  
  if (isLoading) {
    return (
      <div className="p-6 rounded-xl backdrop-blur-lg bg-white/5 hover:bg-white/10 shadow-[0_8px_32px_rgb(31,38,135,0.15)] transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <h3 className="text-xl text-white">Matches</h3>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-white/5"></div>
              <div className="flex-1">
                <div className="h-5 bg-white/5 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-white/5 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <div className="h-10 bg-white/5 rounded-lg w-1/2"></div>
        </div>
      </div>
    );
  }
  
  if (displayMatches.length === 0) {
    return (
      <div className="p-6 rounded-xl backdrop-blur-lg bg-white/5 hover:bg-white/10 shadow-[0_8px_32px_rgb(31,38,135,0.15)] transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <h3 className="text-xl text-white">Matches</h3>
          </div>
          {matches.length > 0 && (
            <div className="text-sm text-white px-2 py-1 bg-white/10 rounded-full">
              <span className="text-[#34D8F1] cursor-pointer" onClick={navigateToMatches}>View All</span>
            </div>
          )}
        </div>
        
        <div className="bg-white/10 rounded-xl overflow-hidden">
          <div className="p-6 flex flex-col items-center text-center">
            <h4 className="text-xl font-normal text-[#5B3CDD] mb-2">No matches found</h4>
            <p className="text-white text-base mb-4">Currently showing all matches for debugging. No matches were found in the system.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 rounded-xl backdrop-blur-lg bg-white/5 hover:bg-white/10 shadow-[0_8px_32px_rgb(31,38,135,0.15)] transition-all duration-300">

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/10 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h3 className="text-xl text-white">Matches</h3>
        </div>
        <div className="text-sm text-white px-2 py-1 bg-white/10 rounded-full">
          <span className="text-[#34D8F1] cursor-pointer" onClick={navigateToMatches}>
            View All {matches.length > 0 && `(${matches.length})`}
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        {displayMatches.map(match => (
          <div 
            key={match.id} 
            className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/matches/${match.id}`);
            }}
          >
            <div className="relative w-16 h-16 rounded-full overflow-hidden">
              {match.matchedUserData.profilePhotoUrl ? (
                <Image
                  src={match.matchedUserData.profilePhotoUrl}
                  alt={`${match.matchedUserData.firstName}'s profile`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#2800A3]/30 to-[#34D8F1]/30 flex items-center justify-center">
                  <span className={`${playfair.className} text-xl text-white/70`}>
                    {match.matchedUserData.firstName.charAt(0)}
                    {match.matchedUserData.lastName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">
                  {match.matchedUserData.firstName} {match.matchedUserData.lastName}{match.matchedUserData.age ? `, ${match.matchedUserData.age}` : ''}
                </h4>
              </div>
              <div className="flex items-center text-white/50 text-xs">
                <span>
                  {formatDistanceToNow(new Date(match.proposedAt), { addSuffix: true })}
                </span>
                <span className="mx-1">•</span>
                <span>{match.matchedUserData.profession || 'No profession'}</span>
                <span className="mx-1">•</span>
                <span>
                  {match.matchedUserData.location || 
                   match.matchedUserData.questionnaireAnswers?.personal_location || 
                   'No location'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={navigateToMatches}
        className="w-full mt-6 py-3 rounded-lg text-white bg-gradient-to-r from-[#73FFF6] to-[#3B00CC] hover:opacity-90 transition-opacity"
      >
        View All Matches
      </button>
    </div>
  );
};
