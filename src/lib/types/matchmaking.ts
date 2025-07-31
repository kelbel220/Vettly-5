/**
 * Matchmaking types for Vettly-2 application
 */

/**
 * Match approval status enum
 */
export enum MatchApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

/**
 * Match weights for different compatibility categories
 */
export const MATCH_WEIGHTS = {
  AGE: 0.15,           // 15%
  LOCATION: 0.20,      // 20%
  VALUES_LIFESTYLE: 0.25, // 25%
  PHYSICAL: 0.15,      // 15%
  INTERESTS: 0.15,     // 15%
  OTHER: 0.10          // 10%
};

/**
 * Matching point interface for individual compatibility factors
 */
export interface MatchingPoint {
  category: string;
  description: string;
  score: number;  // 0-1 decimal representing percentage
}

/**
 * Match record interface for Firebase storage
 */
export interface MatchRecord {
  member1Id: string;
  member2Id: string;
  compatibilityScore: number;  // 0-100 whole number percentage
  matchingPoints: MatchingPoint[];
  createdAt: string;  // ISO date string
  proposedAt: string;  // ISO date string
  approvedAt?: string;  // ISO date string
  status: MatchApprovalStatus;
  matchmakerId: string;
  compatibilityExplanation?: string;  // OpenAI-generated explanation
}

/**
 * Match result interface for UI display
 */
export interface MatchResult {
  memberId: string;
  compatibilityScore: number;  // 0-100 whole number percentage
  matchingPoints: MatchingPoint[];
  memberData: any;  // Member data object
  matchId?: string;  // Firebase document ID
  status?: MatchApprovalStatus;
  compatibilityExplanation?: string;  // OpenAI-generated explanation
}

/**
 * Proposed match interface for user display
 */
export interface ProposedMatch {
  id: string;  // Match ID
  currentUserId?: string;  // ID of the current user
  member1Id?: string;  // ID of member 1
  member2Id?: string;  // ID of member 2
  matchedUserId: string;  // ID of the matched user
  matchedUserData: {
    firstName: string;
    lastName: string;
    age?: number;
    location?: string;
    state?: string;
    suburb?: string;
    profession?: string;
    profilePhotoUrl?: string;
    educationLevel?: string;
    maritalStatus?: string;
    questionnaireAnswers?: Record<string, any>;
  };
  compatibilityScore: number;  // 0-100 whole number percentage
  compatibilityExplanation?: string;  // OpenAI-generated explanation
  member1Explanation?: string;  // Explanation for member 1 (male)
  member2Explanation?: string;  // Explanation for member 2 (female)
  member1Points?: { header: string; explanation: string }[];  // Structured points for member 1
  member2Points?: { header: string; explanation: string }[];  // Structured points for member 2
  matchingPoints: MatchingPoint[];
  proposedAt: string;  // ISO date string
  status: MatchApprovalStatus;
  // New fields for tracking match acceptance
  member1Accepted?: boolean;
  member2Accepted?: boolean;
  member1AcceptedAt?: string;  // ISO date string
  member2AcceptedAt?: string;  // ISO date string
  // New fields for payment and virtual meeting
  paymentRequired?: boolean;
  paymentCompleted?: boolean;
  paymentCompletedAt?: string;  // ISO date string
  virtualMeetingRequired?: boolean;
  virtualMeetingScheduled?: boolean;
  virtualMeetingScheduledAt?: string;  // ISO date string
  virtualMeetingCompleted?: boolean;
  virtualMeetingCompletedAt?: string;  // ISO date string
}
