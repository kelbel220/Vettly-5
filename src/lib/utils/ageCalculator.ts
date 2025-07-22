/**
 * Utility function to calculate age from DOB in Australian format (DD.MM.YYYY)
 * or fall back to age field if DOB is not available
 */

interface UserData {
  dob?: string;
  age?: number;
  questionnaireAnswers?: {
    personal_dob?: string;
    personal_age?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Calculate age from DOB in Australian format (DD.MM.YYYY)
 * or fall back to age field if DOB is not available
 * @param userData User data object
 * @returns Calculated age or undefined if not available
 */
export function calculateAge(userData: UserData): number | undefined {
  // Try to calculate age from DOB first
  const dob = userData.dob || userData.questionnaireAnswers?.personal_dob;
  
  if (dob) {
    // Parse Australian date format (DD.MM.YYYY)
    const parts = dob.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
      const year = parseInt(parts[2], 10);
      
      const birthDate = new Date(year, month, day);
      const today = new Date();
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    }
  }
  
  // Fall back to age field if DOB calculation failed
  // Following the memory that personal_age should be used instead of age
  return userData.questionnaireAnswers?.personal_age || userData.age;
}
