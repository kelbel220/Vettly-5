'use client';

import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';

// Collection name for decline analytics
const DECLINE_ANALYTICS_COLLECTION = 'declineAnalytics';

/**
 * Interface for decline analytics data
 */
interface DeclineAnalyticsData {
  memberId: string;
  memberName?: string;
  totalDeclines: number;
  monthlyDeclines: {
    [key: string]: number; // Format: "YYYY-MM"
  };
  lastUpdated: any; // Firebase Timestamp
}

/**
 * Track a declined match for analytics purposes
 * @param memberId The ID of the member who declined the match
 * @param memberName Optional name of the member who declined the match
 * @returns Promise that resolves when the analytics are updated
 */
export async function trackDeclinedMatch(
  memberId: string,
  memberName?: string
): Promise<void> {
  try {
    if (!memberId) {
      console.error('Cannot track declined match: No member ID provided');
      return;
    }

    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Reference to the member's decline analytics document
    const analyticsRef = doc(db, DECLINE_ANALYTICS_COLLECTION, memberId);
    
    // Check if document exists
    const analyticsDoc = await getDoc(analyticsRef);
    
    if (analyticsDoc.exists()) {
      // Update existing analytics document
      const updateData: any = {
        totalDeclines: increment(1),
        lastUpdated: serverTimestamp()
      };
      
      // Update the monthly count
      updateData[`monthlyDeclines.${currentMonth}`] = increment(1);
      
      // Update the member name if provided
      if (memberName) {
        updateData.memberName = memberName;
      }
      
      await updateDoc(analyticsRef, updateData);
    } else {
      // Create new analytics document
      const analyticsData: DeclineAnalyticsData = {
        memberId,
        memberName: memberName || 'Unknown Member',
        totalDeclines: 1,
        monthlyDeclines: {
          [currentMonth]: 1
        },
        lastUpdated: serverTimestamp()
      };
      
      await setDoc(analyticsRef, analyticsData);
    }
    
    console.log(`Decline analytics updated for member ${memberId} for month ${currentMonth}`);
  } catch (error) {
    console.error('Error updating decline analytics:', error);
    // Don't throw the error to prevent disrupting the main flow
  }
}

/**
 * Get decline analytics for a specific member
 * @param memberId The ID of the member
 * @returns Promise that resolves with the decline analytics data
 */
export async function getDeclineAnalytics(
  memberId: string
): Promise<DeclineAnalyticsData | null> {
  try {
    if (!memberId) {
      console.error('Cannot get decline analytics: No member ID provided');
      return null;
    }
    
    const analyticsRef = doc(db, DECLINE_ANALYTICS_COLLECTION, memberId);
    const analyticsDoc = await getDoc(analyticsRef);
    
    if (analyticsDoc.exists()) {
      return analyticsDoc.data() as DeclineAnalyticsData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting decline analytics:', error);
    return null;
  }
}
