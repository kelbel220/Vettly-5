'use client';

import React from 'react';
import { WeeklyTip } from '@/lib/models/weeklyTip';
import { format } from 'date-fns';

interface WeeklyTipButtonProps {
  tip: WeeklyTip | null;
  hasUserSeen: boolean;
  onClick: () => void;
  loading?: boolean;
}

/**
 * Button component to display and open the weekly tip
 */
export const WeeklyTipButton: React.FC<WeeklyTipButtonProps> = ({
  tip,
  hasUserSeen,
  onClick,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="p-6 rounded-xl backdrop-blur-lg bg-white/5 animate-pulse">
        <div className="h-24"></div>
      </div>
    );
  }

  if (!tip) {
    return null;
  }

  // Format the date for display
  let publishedDate = format(new Date(), 'MMMM d, yyyy');
  
  try {
    if (tip.publishedAt) {
      // Handle different types of timestamp formats
      const publishedAt = tip.publishedAt as any; // Use any to handle different timestamp formats
      
      if (typeof publishedAt === 'object' && publishedAt !== null) {
        if (publishedAt.toDate && typeof publishedAt.toDate === 'function') {
          // Firestore Timestamp object
          publishedDate = format(publishedAt.toDate(), 'MMMM d, yyyy');
        } else if (publishedAt.seconds && typeof publishedAt.seconds === 'number') {
          // Timestamp-like object with seconds
          publishedDate = format(new Date(publishedAt.seconds * 1000), 'MMMM d, yyyy');
        } else {
          // Try to use it as a date directly
          publishedDate = format(new Date(publishedAt), 'MMMM d, yyyy');
        }
      } else if (typeof publishedAt === 'number' || typeof publishedAt === 'string') {
        // Number (timestamp) or string date
        publishedDate = format(new Date(publishedAt), 'MMMM d, yyyy');
      }
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    // Fallback to current date if there's an error
    publishedDate = format(new Date(), 'MMMM d, yyyy');
  }

  return (
    <div className="p-6 rounded-xl backdrop-blur-lg bg-white/5 hover:bg-white/10 shadow-[0_8px_32px_rgb(31,38,135,0.15)] transition-all duration-300 relative">
      {/* New badge - only show if user hasn't seen this tip */}
      {!hasUserSeen && (
        <div className="absolute -top-2 -right-2 bg-[#00FFFF] text-[#2D0F63] text-xs font-bold px-2 py-1 rounded-full animate-pulse">
          NEW
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/10 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <h3 className="text-xl text-white">Weekly Insight</h3>
        </div>
        <div className="text-sm text-white/60">
          {publishedDate}
        </div>
      </div>

      <div className="bg-white/10 rounded-xl overflow-hidden">
        <div className="p-6">
          <h4 className="text-xl font-normal text-[#5B3CDD] mb-2">{tip.title}</h4>
          <p className="text-white text-base mb-4">
            {tip.shortDescription || tip.content?.substring(0, 120) + '...'}
          </p>
          
          {/* Read More Button */}
          <button 
            onClick={onClick}
            className="bg-white/15 hover:bg-white/20 text-white px-6 py-2 rounded-full transition-colors text-sm font-medium"
          >
            Read Full Tip
          </button>
        </div>
      </div>
    </div>
  );
};
