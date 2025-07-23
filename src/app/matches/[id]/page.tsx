'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrbField } from '@/app/components/gradients/OrbField';
import { HomeOrbField } from '@/app/components/gradients/HomeOrbField';
import { db } from '@/lib/firebase-init';
import { doc, getDoc } from 'firebase/firestore';
import { ProposedMatch, MatchApprovalStatus } from '@/lib/types/matchmaking';
import { useProposedMatches } from '@/hooks/useProposedMatches';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { inter, playfair } from '@/app/fonts';
import { MdSmokingRooms } from 'react-icons/md';
import { FaWineGlassAlt, FaChild, FaBabyCarriage } from 'react-icons/fa';
import MatchExplanation from '@/components/matches/MatchExplanation';

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.id as string;
  
  // If no match ID is provided, redirect to matches page
  if (!matchId) {
    router.push('/matches');
    return null;
  }
  
  const { matches, loading, acceptMatch, declineMatch } = useProposedMatches();
  const [match, setMatch] = useState<ProposedMatch | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  useEffect(() => {
    if (!loading && matches.length > 0) {
      const foundMatch = matches.find(m => m.id === matchId);
      if (foundMatch) {
        setMatch(foundMatch);
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
  
  // Handle decline match
  const handleDeclineMatch = async () => {
    if (match) {
      await declineMatch(match.id);
      // Stay on the page to show the updated status
    }
  };
  
  // Function to regenerate explanation for current match
  const regenerateExplanation = async () => {
    if (!match) return;
    
    setIsRegenerating(true);
    console.log('Regenerating explanation for match:', match.id);
    
    try {
      // Get the matched user data from Firebase to ensure we have the correct data
      const matchRef = doc(db, 'matches', match.id);
      const matchDoc = await getDoc(matchRef);
      
      if (!matchDoc.exists()) {
        throw new Error('Match not found in Firebase');
      }
      
      const matchData = matchDoc.data();
      console.log('Match data from Firebase:', matchData);
      
      // Determine the member IDs to use
      let member1Id = matchData.member1Id || match.member1Id;
      let member2Id = matchData.member2Id || match.member2Id;
      
      // If we still don't have member IDs, try to construct them from other fields
      if (!member1Id || !member2Id) {
        console.log('Member IDs not found in match data, attempting to construct them');
        
        // In Vettly, member1 is male and member2 is female
        // Try to determine the IDs based on the current user and matched user
        if (match.currentUserId && match.matchedUserId) {
          // If we have both IDs, use them (order doesn't matter for the API)
          member1Id = match.currentUserId;
          member2Id = match.matchedUserId;
          console.log('Using currentUserId and matchedUserId as member IDs');
        }
      }
      
      // Final check to ensure we have both member IDs
      if (!member1Id || !member2Id) {
        throw new Error('Could not determine member IDs for this match');
      }
      
      // In Vettly, member1 should be male and member2 should be female
      // Let's make sure we're sending the IDs in the correct order
      // This ensures the API generates the correct gender-specific explanations
      const payload = {
        matchId: match.id,
        member1Id, // Male ID
        member2Id  // Female ID
      };
      
      console.log('Using member IDs:', { member1Id, member2Id });
      
      console.log('Request payload:', payload);
      
      // Make the API request
      const response = await fetch('/api/matches/generate-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      
      // Parse the response
      const data = await response.json();
      console.log('Explanation regenerated successfully:', data);
      
      // Update the match with new explanation data
      setMatch({
        ...match,
        member1Explanation: data.member1Explanation,
        member2Explanation: data.member2Explanation,
        member1Points: data.member1Points,
        member2Points: data.member2Points
      });
      
      alert('Match explanation regenerated successfully!');
    } catch (error) {
      console.error('Failed to regenerate explanation:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to regenerate explanation: ${errorMessage}`);
    } finally {
      setIsRegenerating(false);
    }
  };
  
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
    state
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
      <div className="relative z-10 container mx-auto px-4 py-4">
        {/* Back button */}
        <button 
          onClick={handleBack}
          className="mb-4 flex items-center text-white hover:text-[#73FFF6] transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Matches</span>
        </button>
        
        {/* Card container */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-white/15 backdrop-blur-xl shadow-[0_8px_32px_rgb(31,38,135,0.2)] p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left column - Profile photo and basic info */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
              {/* Profile Photo with bright neon cyan glow */}
              <div className="relative w-full aspect-square">
                {/* Diffused glow layers */}
                <div className="absolute -inset-1 rounded-xl bg-[#73FFF6] blur-[8px] opacity-80 z-5"></div>
                <div className="absolute -inset-3 rounded-2xl bg-[#73FFF6] blur-[25px] opacity-70 animate-pulse z-0"></div>
                <div className="absolute -inset-5 rounded-3xl bg-[#73FFF6] blur-[35px] opacity-40 z-0"></div>
                {/* Subtle border */}
                <div className="absolute inset-0 rounded-xl border border-[#73FFF6] shadow-[0_0_8px_#73FFF6] z-10"></div>
                {/* Content container */}
                <div className="absolute inset-[1px] rounded-xl overflow-hidden z-20">
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
              </div>
              
              {/* Name and Age Heading - clean and elegant */}
              <div className="mb-4">
                <h2 className={`${playfair.className} text-4xl md:text-5xl font-normal text-white mb-1`}>
                  {matchedUserData.firstName} {matchedUserData.lastName}, {age}
                </h2>
                {/* Location below name */}
                <p className={`${playfair.className} text-white/75 text-xl mb-3`}>
                  {displayLocation !== 'Location not specified' ? displayLocation : ''}
                  {displayLocation !== 'Location not specified' && state ? ', ' : ''}
                  {state}
                </p>
              </div>
              
              {/* Basic Info Card - Single Glass Box with soft glow */}
              <div className="bg-white/8 backdrop-blur-md rounded-xl p-5 shadow-inner shadow-white/5 border border-[#73FFF6]/20 shadow-[0_0_15px_rgba(115,255,246,0.15)]">
                <h3 className={`${inter.className} text-xl font-semibold text-[#73FFF6] mb-3 border-b border-[#73FFF6]/30 pb-1`}>
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
              
              {/* Lifestyle */}
              <div className="bg-white/8 backdrop-blur-md rounded-xl p-5 mt-4 shadow-inner shadow-white/5 border border-[#73FFF6]/20 shadow-[0_0_15px_rgba(115,255,246,0.15)]">
                <h3 className={`${inter.className} text-xl font-semibold text-[#73FFF6] mb-3 border-b border-[#73FFF6]/30 pb-1`}>
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
                  <div className="mt-6">
                    <p className="text-white/70 text-sm mb-2">Hobbies & Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(matchedUserData.questionnaireAnswers.lifestyle_hobbiesTypes) ? 
                        matchedUserData.questionnaireAnswers.lifestyle_hobbiesTypes.map((hobby: string, index: number) => (
                          <span 
                            key={index} 
                            className="bg-[#34D8F1]/30 backdrop-blur-md border border-[#34D8F1]/50 rounded-full px-3 py-1 text-white text-sm font-medium shadow-sm"
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
            
            {/* Right column - Match details */}
            <div className="flex-1">
              {/* Status Pills */}
              <div className="mb-0">
                <div className="flex flex-wrap gap-3">
                  {hasChildren !== 'Not specified' && (
                    <div className="bg-[#34D8F1]/30 backdrop-blur-md border border-[#34D8F1]/50 rounded-full px-3 py-1 text-white text-sm font-medium shadow-sm">
                      {hasChildren}
                    </div>
                  )}

                </div>
              </div>
              
              {/* Why you're a great match - with border glow */}
              <div className="relative mb-4 mt-4">
                {/* Glass box matching About section with brighter and stronger glow */}
                <div className="relative bg-white/8 backdrop-blur-md rounded-xl p-5 shadow-inner shadow-white/5 border-[1.5px] border-[#73FFF6]/90" style={{ boxShadow: '0 0 15px 5px rgba(115,255,246,0.8), 0 0 30px 15px rgba(115,255,246,0.5), 0 0 60px 25px rgba(115,255,246,0.3), inset 0 0 5px rgba(255,255,255,0.05)' }}>
                  <h3 className={`${playfair.className} text-2xl font-medium text-[#73FFF6] mb-4`}>
                    Why you're a great match
                  </h3>
                  
                  {/* Display gender-specific explanation */}
                  {/* In Vettly, member1 is male and member2 is female */}
                  {/* Always show member2Points (female explanation) for this user */}
                  {match && match.member2Points ? (
                    <MatchExplanation 
                      matchPoints={match.member2Points} 
                    />
                  ) : match && match.member2Explanation ? (
                    <MatchExplanation 
                      matchPoints={parseMatchPoints(match.member2Explanation)} 
                    />
                  ) : (
                    <div className="text-white/70 italic text-sm">
                      Match explanation is being generated...
                    </div>
                  )}

                </div>
              </div>
              
              {/* Footer with Date and Actions */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6 mb-2">
                <div className="text-white/50 text-sm mb-4 md:mb-0">
                  <span>Proposed {timeAgo} • {formattedDate}</span>
                </div>
                
                {status === MatchApprovalStatus.PENDING && (
                  <div className="flex gap-4 w-full md:w-auto">
                    <button
                      onClick={handleDeclineMatch}
                      className="flex-1 md:flex-none px-6 py-3 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={handleAcceptMatch}
                      className="flex-1 md:flex-none px-8 py-3 rounded-lg text-white bg-[#3B00CC] hover:opacity-90 transition-opacity"
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
    </div>
  );
}
