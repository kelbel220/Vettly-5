import { db } from '@/lib/firebase-init';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

// Collection names for monitoring
const EXPLANATION_METRICS_COLLECTION = 'explanationMetrics';
const EXPLANATION_ERRORS_COLLECTION = 'explanationErrors';
const EXPLANATION_USAGE_COLLECTION = 'explanationUsage';

/**
 * Monitoring service for match explanations
 * Tracks API usage, error rates, and user engagement
 */

/**
 * Log an OpenAI API call for monitoring purposes
 * 
 * @param matchId The match ID for which the explanation was generated
 * @param tokensUsed Number of tokens used in the API call
 * @param generationTimeMs Time taken to generate the explanation in milliseconds
 * @param dataQualityScore Data quality score used for the explanation
 */
export async function logExplanationGeneration(
  matchId: string,
  tokensUsed: number,
  generationTimeMs: number,
  dataQualityScore: number
): Promise<void> {
  try {
    // Log the API call
    await addDoc(collection(db, EXPLANATION_METRICS_COLLECTION), {
      matchId,
      tokensUsed,
      generationTimeMs,
      dataQualityScore,
      timestamp: serverTimestamp(),
      type: 'generation'
    });
    
    // Update aggregate usage metrics
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const usageRef = doc(db, EXPLANATION_USAGE_COLLECTION, today);
    
    await updateDoc(usageRef, {
      totalCalls: increment(1),
      totalTokens: increment(tokensUsed),
      totalGenerationTimeMs: increment(generationTimeMs),
      averageQualityScore: increment(dataQualityScore / 100) // Normalized for moving average
    }).catch(async () => {
      // Document doesn't exist yet, create it
      await addDoc(collection(db, EXPLANATION_USAGE_COLLECTION), {
        date: today,
        totalCalls: 1,
        totalTokens: tokensUsed,
        totalGenerationTimeMs: generationTimeMs,
        averageQualityScore: dataQualityScore / 100
      });
    });
  } catch (error) {
    console.error('Error logging explanation generation:', error);
    // Don't throw - monitoring should not interrupt the main flow
  }
}

/**
 * Log an error that occurred during explanation generation
 * 
 * @param matchId The match ID for which the explanation was being generated
 * @param errorType Type of error (e.g., 'api_error', 'timeout', 'data_quality')
 * @param errorMessage Detailed error message
 * @param statusCode HTTP status code if applicable
 */
export async function logExplanationError(
  matchId: string,
  errorType: string,
  errorMessage: string,
  statusCode?: number
): Promise<void> {
  try {
    await addDoc(collection(db, EXPLANATION_ERRORS_COLLECTION), {
      matchId,
      errorType,
      errorMessage,
      statusCode,
      timestamp: serverTimestamp()
    });
    
    // Update aggregate error metrics
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const usageRef = doc(db, EXPLANATION_USAGE_COLLECTION, today);
    
    await updateDoc(usageRef, {
      totalErrors: increment(1),
      [`errorsByType.${errorType}`]: increment(1)
    }).catch(() => {
      // Ignore if document doesn't exist yet
    });
  } catch (error) {
    console.error('Error logging explanation error:', error);
    // Don't throw - monitoring should not interrupt the main flow
  }
}

/**
 * Log user engagement with an explanation
 * 
 * @param matchId The match ID for which the explanation was viewed
 * @param userId The user ID who viewed the explanation
 * @param action The engagement action (e.g., 'viewed', 'liked', 'disliked')
 * @param durationMs How long the user viewed the explanation (if applicable)
 */
export async function logExplanationEngagement(
  matchId: string,
  userId: string,
  action: 'viewed' | 'liked' | 'disliked' | 'accepted' | 'declined',
  durationMs?: number
): Promise<void> {
  try {
    await addDoc(collection(db, EXPLANATION_METRICS_COLLECTION), {
      matchId,
      userId,
      action,
      durationMs,
      timestamp: serverTimestamp(),
      type: 'engagement'
    });
    
    // Update aggregate engagement metrics
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const usageRef = doc(db, EXPLANATION_USAGE_COLLECTION, today);
    
    await updateDoc(usageRef, {
      [`engagementByType.${action}`]: increment(1)
    }).catch(() => {
      // Ignore if document doesn't exist yet
    });
  } catch (error) {
    console.error('Error logging explanation engagement:', error);
    // Don't throw - monitoring should not interrupt the main flow
  }
}

/**
 * Calculate estimated cost of OpenAI API usage
 * Based on current OpenAI pricing (may need updates as pricing changes)
 * 
 * @param tokensUsed Number of tokens used
 * @param model OpenAI model used (default: gpt-4-turbo)
 * @returns Estimated cost in USD
 */
export function calculateOpenAICost(tokensUsed: number, model: string = 'gpt-4-turbo'): number {
  // Pricing as of July 2023 (per 1M tokens)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4-turbo': { input: 10, output: 30 }, // $10 per 1M input tokens, $30 per 1M output tokens
    'gpt-4': { input: 30, output: 60 },
    'gpt-3.5-turbo': { input: 1, output: 2 }
  };
  
  // Default to gpt-4-turbo pricing if model not found
  const modelPricing = pricing[model] || pricing['gpt-4-turbo'];
  
  // Assume 20% of tokens are input and 80% are output for a typical completion
  const inputTokens = tokensUsed * 0.2;
  const outputTokens = tokensUsed * 0.8;
  
  // Calculate cost in USD
  const inputCost = (inputTokens / 1000000) * modelPricing.input;
  const outputCost = (outputTokens / 1000000) * modelPricing.output;
  
  return inputCost + outputCost;
}
