'use client';

import React from 'react';
import { ProposedMatch, MatchApprovalStatus } from '@/lib/types/matchmaking';
import { MatchNotification } from '@/hooks/useMatchNotifications';
import { ProposedMatchCard } from './ProposedMatchCard';
import { useRouter } from 'next/navigation';
import { inter, playfair } from '@/app/fonts';
import Image from 'next/image';

// Define the NotificationMatchCard component inline to avoid import issues
const NotificationMatchCard: React.FC<{
  notification: MatchNotification;
  onView: (notificationId: string) => void;
}> = ({ notification, onView }) => {
  const { matchData } = notification;
  
  // Format date to be more readable
  const formattedDate = new Date(notification.createdAt).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl transition-all hover:shadow-2xl">
      <div className="flex flex-col md:flex-row">
        {/* Profile Photo */}
        <div className="w-full md:w-1/3 aspect-square relative">
          {matchData.otherMemberPhotoUrl ? (
            <Image
              src={matchData.otherMemberPhotoUrl}
              alt={matchData.otherMemberName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <span className={`${playfair.className} text-4xl text-white`}>
                {matchData.otherMemberName.split(' ').map(name => name[0]).join('')}
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            New Match
          </div>
        </div>
        
        {/* Match Details */}
        <div className="flex-1 p-6">
          <h3 className={`${playfair.className} text-2xl font-medium text-white mb-2`}>
            {matchData.otherMemberName}
          </h3>
          
          {/* Compatibility Score */}
          <div className="flex items-center mb-4">
            <div className="w-24 h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500" 
                style={{ width: `${matchData.compatibilityScore}%` }}
              ></div>
            </div>
            <span className="ml-2 text-white/70 text-sm">
              {matchData.compatibilityScore}% Match
            </span>
          </div>
          
          {/* Matching Points */}
          {matchData.matchingPoints && matchData.matchingPoints.length > 0 && (
            <div className="mb-4">
              <h4 className={`${inter.className} text-sm font-medium text-white/80 mb-2`}>
                You both match on:
              </h4>
              <div className="flex flex-wrap gap-2">
                {matchData.matchingPoints.map((point, index) => (
                  <span 
                    key={index}
                    className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full"
                  >
                    {point.category}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Date and Matchmaker */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-white/50 text-xs">
              Matched on {formattedDate} by {matchData.matchmakerName}
            </div>
            
            {/* Action Button */}
            <button
              onClick={() => onView(notification.id)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              View Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MatchesListProps {
  matches: ProposedMatch[];
  notifications?: MatchNotification[];
  onAcceptMatch: (matchId: string) => void;
  onDeclineMatch: (matchId: string) => void;
  onViewNotification?: (notificationId: string) => void;
  isLoading?: boolean;
}

export const MatchesList: React.FC<MatchesListProps> = ({
  matches,
  notifications = [],
  onAcceptMatch,
  onDeclineMatch,
  onViewNotification = () => {},
  isLoading = false
}) => {
  const router = useRouter();
  
  const handleViewMatchDetail = (match: ProposedMatch) => {
    router.push(`/matches/${match.id}`);
  };
  
  // Handler for closing the match detail view
  const handleCloseMatchDetail = () => {
    // setSelectedMatch(null);
  };
  
  // Group matches by status
  const pendingMatches = matches.filter(match => match.status === MatchApprovalStatus.PENDING);
  const acceptedMatches = matches.filter(match => match.status === MatchApprovalStatus.APPROVED);
  const declinedMatches = matches.filter(match => match.status === MatchApprovalStatus.DECLINED);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3 aspect-square bg-white/5 rounded-xl"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-white/5 rounded-lg w-2/3"></div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-6 bg-white/5 rounded-lg"></div>
                  ))}
                </div>
                <div className="h-32 bg-white/5 rounded-xl"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-white/5 rounded w-1/4"></div>
                  <div className="flex gap-3">
                    <div className="h-10 bg-white/5 rounded-lg w-24"></div>
                    <div className="h-10 bg-white/5 rounded-lg w-32"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 8v8a5 5 0 01-5 5H8a5 5 0 01-5-5V8a5 5 0 015-5h8a5 5 0 015 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 12a2 2 0 104 0 2 2 0 00-4 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.3 15a4 4 0 013.4 0" />
          </svg>
        </div>
        <h3 className={`${inter.className} text-xl font-medium text-white mb-2`}>No Matches Yet</h3>
        <p className="text-white/60 text-sm">
          When your matchmaker finds someone compatible with you, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Match cards are now clickable and navigate to the detail page */}
      {/* New Notifications Section */}
      {notifications.length > 0 && (
        <div className="space-y-4">
          <h2 className={`${inter.className} text-xl font-medium text-white flex items-center`}>
            <span className="inline-block w-3 h-3 rounded-full bg-blue-400 mr-2"></span>
            New Match Notifications
            <span className="ml-2 px-2 py-0.5 bg-white/10 text-white/70 text-xs rounded-full">
              {notifications.length}
            </span>
          </h2>
          <div className="space-y-6">
            {notifications.map(notification => (
              <NotificationMatchCard
                key={notification.id}
                notification={notification}
                onView={onViewNotification}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Matches Section */}
      {pendingMatches.length > 0 && (
        <div className="space-y-4">
          <h2 className={`${inter.className} text-xl font-medium text-white flex items-center`}>
            <span className="inline-block w-3 h-3 rounded-full bg-[#73FFF6] mr-2"></span>
            Pending Matches
            <span className="ml-2 px-2 py-0.5 bg-white/10 text-white/70 text-xs rounded-full">
              {pendingMatches.length}
            </span>
          </h2>
          <div className="space-y-6">
            {pendingMatches.map(match => (
              <div 
                key={match.id}
                onClick={() => handleViewMatchDetail(match)}
                className="cursor-pointer"
              >
                <ProposedMatchCard
                  match={match}
                  onAccept={onAcceptMatch}
                  onDecline={onDeclineMatch}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Matches Section */}
      {acceptedMatches.length > 0 && (
        <div className="space-y-4">
          <h2 className={`${inter.className} text-xl font-medium text-white flex items-center`}>
            <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-2"></span>
            Accepted Matches
            <span className="ml-2 px-2 py-0.5 bg-white/10 text-white/70 text-xs rounded-full">
              {acceptedMatches.length}
            </span>
          </h2>
          <div className="space-y-6">
            {acceptedMatches.map(match => (
              <div 
                key={match.id}
                onClick={() => handleViewMatchDetail(match)}
                className="cursor-pointer"
              >
                <ProposedMatchCard
                  match={match}
                  onAccept={onAcceptMatch}
                  onDecline={onDeclineMatch}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Declined Matches Section */}
      {declinedMatches.length > 0 && (
        <div className="space-y-4">
          <h2 className={`${inter.className} text-xl font-medium text-white flex items-center`}>
            <span className="inline-block w-3 h-3 rounded-full bg-red-400 mr-2"></span>
            Declined Matches
            <span className="ml-2 px-2 py-0.5 bg-white/10 text-white/70 text-xs rounded-full">
              {declinedMatches.length}
            </span>
          </h2>
          <div className="space-y-6">
            {declinedMatches.map(match => (
              <div 
                key={match.id}
                onClick={() => handleViewMatchDetail(match)}
                className="cursor-pointer"
              >
                <ProposedMatchCard
                  match={match}
                  onAccept={onAcceptMatch}
                  onDecline={onDeclineMatch}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
