'use client';

import React, { useEffect, useState } from 'react';
import { WeeklyTip, WeeklyTipCategory } from '@/lib/models/weeklyTip';
import { inter, playfair } from '@/app/fonts';
import { format } from 'date-fns';

// Type definition for Firestore timestamp-like objects
interface FirestoreTimestamp {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
}

interface WeeklyTipModalProps {
  tip: WeeklyTip;
  isOpen: boolean;
  onClose: () => void;
  onRead: () => void;
}

export const WeeklyTipModal: React.FC<WeeklyTipModalProps> = ({
  tip,
  isOpen,
  onClose,
  onRead
}) => {
  // Add state to track if we've processed the tip
  const [processedTip, setProcessedTip] = useState<WeeklyTip | null>(null);
  
  // Process the tip when it changes
  useEffect(() => {
    if (tip) {
      try {
        // Create a deep copy of the tip to avoid reference issues
        const updatedTip = JSON.parse(JSON.stringify(tip));
        
        // Log the original tip data for debugging
        console.log('Original tip data:', JSON.stringify(tip));
        
        // Force set whyMatters field with default content based on category
        // This ensures it always has content regardless of what's in the database
        updatedTip.whyMatters = updatedTip.whyMatters || getDefaultWhyMattersContent(updatedTip.category);
        
        // Ensure quickTips is always an array
        if (!updatedTip.quickTips || !Array.isArray(updatedTip.quickTips)) {
          updatedTip.quickTips = [];
        }
        
        // Log the processed tip data
        console.log('Processed tip data:', JSON.stringify(updatedTip));
        
        setProcessedTip(updatedTip);
      } catch (error) {
        console.error('Error processing tip:', error);
        // If there's an error, still try to show the tip
        setProcessedTip(tip);
      }
    }
  }, [tip]);
  // Mark the tip as read when it's opened
  useEffect(() => {
    if (isOpen && tip) {
      onRead();
    }
  }, [isOpen, tip, onRead]);

  if (!isOpen || !tip || !processedTip) {
    return null;
  }

  // Format the date for display with error handling
  const publishedDate = (() => {
    try {
      if (processedTip.publishedAt) {
        // Handle Firestore timestamp objects
        if (typeof processedTip.publishedAt === 'object' && processedTip.publishedAt !== null) {
          // Cast to FirestoreTimestamp to access potential Firestore timestamp properties
          const timestamp = processedTip.publishedAt as unknown as FirestoreTimestamp;
          
          // Check if it's a Firestore timestamp with toDate method
          if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return format(timestamp.toDate(), 'MMMM d, yyyy');
          }
          
          // Check if it has seconds property (timestamp-like object)
          if (timestamp.seconds && typeof timestamp.seconds === 'number') {
            return format(new Date(timestamp.seconds * 1000), 'MMMM d, yyyy');
          }
        }
        
        // Try to parse as regular date string or number
        return format(new Date(processedTip.publishedAt), 'MMMM d, yyyy');
      }
      
      // Default to current date
      return format(new Date(), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Today'; // Fallback text if date formatting fails
    }
  })();

  // Get the icon based on the tip category
  const getCategoryIcon = () => {
    switch (processedTip.category) {
      case WeeklyTipCategory.SELF_IMPROVEMENT:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        );
      case WeeklyTipCategory.CONVERSATION_STARTERS:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        );
      case WeeklyTipCategory.DATE_IDEAS:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        );
      case WeeklyTipCategory.RELATIONSHIP_ADVICE:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        );
      case WeeklyTipCategory.MATCHMAKING_INSIGHTS:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
          </svg>
        );
      case WeeklyTipCategory.SELF_IMPROVEMENT:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FFFF]">
            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
          </svg>
        );
    }
  };

  // Get the category display name
  const getCategoryDisplayName = (category: WeeklyTipCategory): string => {
    switch (category) {
      case WeeklyTipCategory.SELF_IMPROVEMENT:
        return 'Self Improvement';
      case WeeklyTipCategory.CONVERSATION_STARTERS:
        return 'Conversation Starters';
      case WeeklyTipCategory.DATE_IDEAS:
        return 'Date Ideas';
      case WeeklyTipCategory.RELATIONSHIP_ADVICE:
        return 'Relationship Advice';
      case WeeklyTipCategory.MATCHMAKING_INSIGHTS:
        return 'Matchmaking Insights';
      default:
        return 'Weekly Insight';
    }
  };

  // Get default content for Why This Matters section based on category
  const getDefaultWhyMattersContent = (category: WeeklyTipCategory): string => {
    switch (category) {
      case WeeklyTipCategory.CONVERSATION_STARTERS:
        return 'Effective conversation starters help break the ice and establish a genuine connection. They show your interest in getting to know the other person and can reveal compatibility through shared interests or values.';
      case WeeklyTipCategory.DATE_IDEAS:
        return 'Creative date ideas can make your time together more memorable and enjoyable. They provide opportunities for authentic interaction and help you both relax and be yourselves.';
      case WeeklyTipCategory.RELATIONSHIP_ADVICE:
        return 'Understanding relationship dynamics helps build stronger connections. This insight allows you to navigate challenges more effectively and create a foundation of mutual respect and understanding.';
      case WeeklyTipCategory.MATCHMAKING_INSIGHTS:
        return 'Knowing what makes a good match helps you recognize compatibility factors that matter. This awareness guides better choices and increases your chances of finding a meaningful connection.';
      case WeeklyTipCategory.SELF_IMPROVEMENT:
        return 'Personal growth enhances your dating experience by building confidence and self-awareness. When you feel good about yourself, you bring your best self to relationships and attract partners who value you.';
      default:
        return 'This tip provides valuable guidance to enhance your dating experience. Applying these insights can lead to more meaningful connections and better outcomes in your relationships.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md overflow-y-auto">
      <div className="bg-gradient-to-br from-[#4FB8E7] via-[#3373C4] to-[#2D0F63] rounded-3xl w-full max-w-5xl overflow-hidden border border-white/20 shadow-2xl my-8">
        {/* Modal Header */}
        <div className="relative px-8 pt-8 pb-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#00FFFF]/20 flex items-center justify-center border border-[#00FFFF]/40">
              {getCategoryIcon()}
            </div>
            <div>
              <p className="text-[#00FFFF] text-xs uppercase tracking-widest font-inter font-medium">
                {getCategoryDisplayName(processedTip.category)}
              </p>
              <h1 className={`${playfair.className} text-3xl font-bold text-white`}>
                {processedTip.title}
              </h1>
            </div>
          </div>
          <button 
            onClick={onClose}
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
            <p className="text-white/40 text-sm font-inter">{publishedDate}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        {/* Main Content */}
        <div className="px-8 py-6 overflow-y-auto max-h-[70vh] md:max-h-[80vh]">
          <div className="text-white/90 max-w-none font-inter space-y-6">
            {/* Main Content */}
            <div>
              <div>
                <p className="text-base leading-relaxed whitespace-pre-line">
                  {processedTip.content}
                </p>
              </div>
            </div>
            
            {/* Why This Matters Section */}
            <div className="pt-4">
              <h5 className={`${playfair.className} text-xl font-semibold mb-3 text-white`}>
                Why This Matters
              </h5>
              <div>
                <p className="text-base leading-relaxed whitespace-pre-line">
                  {processedTip.whyMatters}
                </p>
              </div>
            </div>
            
            {/* Quick Tips Section */}
            {processedTip.quickTips && processedTip.quickTips.length > 0 && (
              <div className="pt-4">
                <h5 className={`${playfair.className} text-xl font-semibold mb-3 text-white`}>
                  Quick Tips
                </h5>
                <ul className="space-y-2 text-base">
                  {processedTip.quickTips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#00FFFF] mr-2">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Did You Know Section */}
            {processedTip.didYouKnow && (
              <div className="pt-4">
                <h5 className={`${playfair.className} text-xl font-semibold mb-3 text-white`}>
                  Did You Know?
                </h5>
                <p className="text-base leading-relaxed">
                  {processedTip.didYouKnow}
                </p>
              </div>
            )}
            
            {/* This Week's Challenge Section */}
            {processedTip.weeklyChallenge && (
              <div className="mt-8 bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                <h5 className={`${playfair.className} text-xl font-semibold mb-3 text-white`}>This Week's Challenge</h5>
                <p className="text-base leading-relaxed text-white">
                  {processedTip.weeklyChallenge}
                </p>
              </div>
            )}
          </div>
          
          {/* Action Button */}
          <div className="mt-10 mb-2 flex justify-center">
            <button 
              onClick={onClose}
              className="bg-[#00FFFF] hover:bg-[#00CCCC] text-black px-10 py-3 rounded-full transition-all text-base font-medium tracking-wide shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
