'use client';

import React from 'react';
import { MatchNotification } from '@/hooks/useMatchNotifications';
import { inter, playfair } from '@/app/fonts';
import Image from 'next/image';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface NotificationMatchCardProps {
  notification: MatchNotification;
  onView: (notificationId: string) => void;
}

export const NotificationMatchCard: React.FC<NotificationMatchCardProps> = ({
  notification,
  onView
}) => {
  const { matchData } = notification;
  
  // Format date to be more readable
  const formattedDate = new Date(notification.createdAt).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Check if this is a declined match notification
  const isDeclinedMatch = notification.status === 'declined' || notification.type === 'match_declined';

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
          <div className={`absolute top-3 right-3 ${isDeclinedMatch ? 'bg-red-500' : 'bg-blue-500'} text-white text-xs px-2 py-1 rounded-full`}>
            {isDeclinedMatch ? 'Declined' : 'New Match'}
          </div>
        </div>
        
        {/* Match Details */}
        <div className="flex-1 p-6">
          <h3 className={`${playfair.className} text-2xl font-medium text-white mb-2`}>
            {matchData.otherMemberName}
          </h3>
          
          {/* Location with state */}
          {matchData.otherMemberLocation && (
            <p className={`${playfair.className} text-white/80 text-base mb-2`}>
              {matchData.otherMemberLocation}
              {matchData.otherMemberState && `, ${matchData.otherMemberState}`}
            </p>
          )}
          
          {/* Compatibility Score */}
          <div className="flex items-center mb-4">
            <div className="w-24 h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full ${isDeclinedMatch ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-blue-400 to-purple-500'}`} 
                style={{ width: `${matchData.compatibilityScore}%` }}
              ></div>
            </div>
            <span className="ml-2 text-white/70 text-sm">
              {matchData.compatibilityScore}% Match
            </span>
          </div>
          
          {/* Declined Message - only show for declined matches */}
          {isDeclinedMatch && (
            <div className="mb-4 p-3 bg-red-500/20 backdrop-blur-sm rounded-lg">
              <div className="flex items-start">
                <XCircleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <div>
                  <h4 className={`${inter.className} text-sm font-medium text-white mb-1`}>
                    Match Declined
                  </h4>
                  <p className="text-white/80 text-sm">
                    {notification.message || `${matchData.otherMemberName} has declined this match.`}
                  </p>
                </div>
              </div>
            </div>
          )}
          
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
              className={`${isDeclinedMatch ? 
                'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700' : 
                'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'} 
                text-white px-6 py-2 rounded-lg shadow-lg transition-all transform hover:scale-105`}
            >
              {isDeclinedMatch ? 'Acknowledge' : 'View Match'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
