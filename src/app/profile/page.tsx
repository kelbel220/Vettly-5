'use client';

import React, { useState, useEffect } from 'react';
import { WineIcon } from './WineIcon';
import { SmokingIcon } from './SmokingIcon';
import { useRouter } from 'next/navigation';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import Image from 'next/image';
import { inter, playfair } from '@/app/fonts';
import { OrbField } from '@/app/components/gradients/OrbField';
import { Tagline } from './Tagline';
import { HomeOrbField } from '@/app/components/gradients/HomeOrbField';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';

interface UserProfile {
  firstName: string;
  lastName: string;
  profilePhotoUrl: string;
  fullBodyPhotoUrl?: string;
  stylePhotoUrl?: string;
  hobbyPhotoUrl?: string;
  personalSummary?: string;
  questionnaireAnswers?: Record<string, any>;
  questionnaireCompleted?: boolean;
  dob?: string;
  suburb?: string;
  state?: string;
  age?: number;
  location?: string;
  relationshipStatus?: string;
  maritalStatus?: string;
  children?: string;
  childrenAges?: string;
  hasChildren?: boolean;
  numberOfChildren?: number;
  height?: string;
  smokingStatus?: string;
  drinkingHabits?: string;
  profession?: string;
  interests?: string[];
  photos?: string[]; // Array of photo URLs for the gallery
  currentPhotoIndex?: number; // Index of the currently displayed photo
}

interface EditFormData extends Partial<UserProfile> {
  interestsInput?: string;
}

export default function Profile() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Summary generation feature has been removed
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Initialize edit form data when modal opens
  const initializeEditForm = () => {
    if (!userData) return;
    
    setEditFormData({
      firstName: userData.firstName,
      lastName: userData.lastName,
      age: userData.age,
      suburb: userData.suburb || '',
      state: userData.state || '',
      profession: userData.profession || userData?.questionnaireAnswers?.lifestyle_profession || '',
      relationshipStatus: userData.relationshipStatus || '',
      height: userData.height || userData?.questionnaireAnswers?.physical_height || '',
      smokingStatus: userData.smokingStatus || userData?.questionnaireAnswers?.lifestyle_smoking || '',
      drinkingHabits: userData.drinkingHabits || userData?.questionnaireAnswers?.lifestyle_drinking || '',
      hasChildren: userData.hasChildren,
      childrenAges: userData.childrenAges || '',
      interests: userData.interests || [],
      personalSummary: userData.personalSummary || ''
    });
  };

  const handleEditProfile = async () => {
    if (!currentUser) return;
    
    setIsSaving(true);
    try {
      // Create a clean data object without the interestsInput field
      const { interestsInput, ...dataToUpdate } = editFormData;
      
      // Format location from suburb and state if both are provided
      if (dataToUpdate.suburb && dataToUpdate.state) {
        dataToUpdate.location = `${dataToUpdate.suburb}, ${dataToUpdate.state}`;
      }
      
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, dataToUpdate);
      
      // Update local state
      if (userData) {
        setUserData({
          ...userData,
          ...dataToUpdate
        });
      }
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Input change: ${name} = ${value}`);
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  // Summary generation feature has been removed

  // Function to calculate age from date of birth in various formats
  const calculateAge = (dob: string | undefined): number | null => {
    if (!dob) return null;
    
    console.log('Calculating age from DOB:', dob);
    
    let birthDate: Date | null = null;
    
    try {
      // Try to parse the date in various formats
      if (dob.includes('.')) {
        // Australian format (DD.MM.YYYY)
        const parts = dob.split('.');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript Date
          const year = parseInt(parts[2], 10);
          birthDate = new Date(year, month, day);
        }
      } else if (dob.includes('/')) {
        // Format with slashes (DD/MM/YYYY for Australian format)
        const parts = dob.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          birthDate = new Date(year, month, day);
        }
      } else if (dob.includes('-')) {
        // ISO format (YYYY-MM-DD)
        const parts = dob.split('-');
        if (parts.length === 3) {
          // Check if first part is a 4-digit year (YYYY-MM-DD)
          if (parts[0].length === 4) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            birthDate = new Date(year, month, day);
          } else {
            // Likely DD-MM-YYYY
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            birthDate = new Date(year, month, day);
          }
        }
      } else {
        // Try standard JavaScript date parsing
        const parsedDate = new Date(dob);
        if (!isNaN(parsedDate.getTime())) {
          birthDate = parsedDate;
        }
      }
      
      // If we couldn't parse the date, return null
      if (!birthDate || isNaN(birthDate.getTime())) {
        console.log('Failed to parse date');
        return null;
      }
      
      console.log('Successfully parsed birth date:', birthDate);
      
      // Calculate age based on the current date (2025-06-19 from metadata)
      const today = new Date(2025, 5, 19); // June 19, 2025 (months are 0-indexed)
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // If birthday hasn't occurred yet this year, subtract 1 from age
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      console.log('Calculated age:', age);
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  };
  
  // Function to format children information
  const formatChildrenInfo = (userData: any) => {
    // Check if user has children directly from hasChildren field
    const hasChildren = userData.hasChildren;
    
    if (!hasChildren) {
      return 'No children';
    }
    
    // Try to get children details from questionnaire answers
    const childrenAges = userData.questionnaireAnswers?.childrenAges;
    
    if (childrenAges) {
      return childrenAges; // Return the formatted children info if it exists
    }
    
    // If we have number of children but no details, try to generate basic info
    const numberOfChildren = userData.questionnaireAnswers?.numberOfChildren;
    
    if (numberOfChildren) {
      return `Has ${numberOfChildren} children`;
    }
    
    return 'Has children'; // Default fallback
  };

  // Function to simplify smoking habit display
  const formatSmokingHabit = (habit: string | undefined): string => {
    if (!habit) return 'Not specified';
    
    // Check if the habit contains explanatory text in parentheses
    if (habit.toLowerCase().includes('never')) {
      return 'No';
    }
    
    // For other cases, return the habit as is or simplify based on common patterns
    return habit;
  };

  // Function to simplify drinking habit display
  const formatDrinkingHabit = (habit: string | undefined): string => {
    if (!habit) return 'Not specified';
    
    // Check if the habit contains explanatory text in parentheses
    if (habit.toLowerCase().includes('socially')) {
      return 'Socially';
    }
    
    // For other cases, return the habit as is or simplify based on common patterns
    return habit;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data() as UserProfile;
            console.log('Firebase userData:', userData);
            console.log('Questionnaire Answers:', userData.questionnaireAnswers);
            
            // Log all keys in questionnaireAnswers to find the correct field name
            if (userData.questionnaireAnswers) {
              console.log('COMPLETE FIREBASE USER DATA:', userData);
              console.log('COMPLETE QUESTIONNAIRE ANSWERS:', userData.questionnaireAnswers);
              console.log('All questionnaire answer keys:', Object.keys(userData.questionnaireAnswers));
              
              // Log specific relationship status fields
              console.log('RELATIONSHIP STATUS DEBUG:');
              console.log('userData.relationshipStatus:', userData.relationshipStatus);
              // Access maritalStatus safely with optional chaining
              console.log('userData.questionnaireAnswers.maritalStatus:', userData.questionnaireAnswers?.maritalStatus);
              
              // Log age fields
              console.log('AGE DEBUG:');
              console.log('userData.age:', userData.age);
              console.log('userData.dob:', userData.dob);
              console.log('userData.questionnaireAnswers.age:', userData.questionnaireAnswers?.age);
              console.log('userData.questionnaireAnswers.attraction_age:', userData.questionnaireAnswers?.attraction_age);
              console.log('userData.questionnaireAnswers.personal_age:', userData.questionnaireAnswers?.personal_age);
              console.log('userData.questionnaireAnswers.personal_dob:', userData.questionnaireAnswers?.personal_dob);
              console.log('userData.questionnaireAnswers.dob:', userData.questionnaireAnswers?.dob);
              
              // Log ALL fields that might contain date information
              console.log('SEARCHING FOR DATE FIELDS:');
              Object.keys(userData).forEach(key => {
                const value = (userData as Record<string, any>)[key];
                if (typeof value === 'string' && 
                    (key.toLowerCase().includes('date') || key.toLowerCase().includes('dob') || key.toLowerCase().includes('birth'))) {
                  console.log(`userData.${key}:`, value);
                }
              });
              
              if (userData.questionnaireAnswers) {
                Object.keys(userData.questionnaireAnswers).forEach(key => {
                  const value = userData.questionnaireAnswers?.[key];
                  if (typeof value === 'string' && 
                      (key.toLowerCase().includes('date') || key.toLowerCase().includes('dob') || key.toLowerCase().includes('birth'))) {
                    console.log(`userData.questionnaireAnswers.${key}:`, value);
                  }
                });
              }
              
              // Log all questionnaire answers with their values
              console.log('DETAILED QUESTIONNAIRE DATA:');
              Object.keys(userData.questionnaireAnswers).forEach(key => {
                console.log(`${key}:`, userData.questionnaireAnswers?.[key]);
              });
              
              // Check for nested data structure
              if (userData.questionnaireAnswers.relationship) {
                console.log('NESTED RELATIONSHIP DATA:', userData.questionnaireAnswers.relationship);
              }
              
              if (userData.questionnaireAnswers.lifestyle) {
                console.log('NESTED LIFESTYLE DATA:', userData.questionnaireAnswers.lifestyle);
              }
              
              if (userData.questionnaireAnswers.physical) {
                console.log('NESTED PHYSICAL DATA:', userData.questionnaireAnswers.physical);
              }
            }
            
            // Process children information
            if (!userData.childrenAges && userData.hasChildren) {
              // Try to fetch additional children data if needed
              try {
                const childrenRef = doc(db, 'userChildren', currentUser.uid);
                const childrenSnap = await getDoc(childrenRef);
                
                if (childrenSnap.exists()) {
                  const childrenData = childrenSnap.data();
                  // Format children data in the desired format (e.g., "14yo Boy, 6yo Girl")
                  if (childrenData.children && childrenData.children.length > 0) {
                    const formattedChildren = childrenData.children
                      .map((child: any) => `${child.age}yo ${child.gender}`)
                      .join(', ');
                    
                    userData.childrenAges = formattedChildren;
                  }
                }
              } catch (childrenError) {
                console.error('Error fetching children data:', childrenError);
              }
            }
            
            // Collect all photo URLs into an array for the gallery
            const photos = [userData.profilePhotoUrl];
            if (userData.fullBodyPhotoUrl) photos.push(userData.fullBodyPhotoUrl);
            if (userData.stylePhotoUrl) photos.push(userData.stylePhotoUrl);
            if (userData.hobbyPhotoUrl) photos.push(userData.hobbyPhotoUrl);
            
            // Filter out any undefined or empty strings
            userData.photos = photos.filter(url => url && url !== '/placeholder-profile.jpg');
            userData.currentPhotoIndex = 0;
            
            setUserData(userData);
          } else {
            // Create a default user profile
            const defaultProfile: UserProfile = {
              firstName: 'New',
              lastName: 'User',
              profilePhotoUrl: '/placeholder-profile.jpg',
              photos: [],
              currentPhotoIndex: 0
            };
            setUserData(defaultProfile);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        router.push('/login');
      }
    };

    fetchUserData();
  }, [currentUser, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#73FFF6] border-t-[#3B00CC] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <h1 className="text-2xl font-bold text-[#3B00CC] mb-4">Profile Not Found</h1>
        <p className="text-gray-600 mb-6">Please complete your profile to continue.</p>
        <button
          onClick={() => router.push('/profile/complete')}
          className="bg-[#3B00CC] text-white px-6 py-2 rounded-full hover:bg-[#2800A3] transition-colors"
        >
          Complete Profile
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background container with fixed position to cover entire viewport */}
      <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
        <div className="absolute inset-0 overflow-hidden">
          <OrbField />
        </div>
      </div>
      
      {/* Main container with very subtle side border */}
      <div className="w-[95%] mx-auto bg-transparent h-full overflow-hidden relative z-10">
        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
            <div className="relative bg-gradient-to-br from-[#2800A3] to-[#34D8F1] p-px rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full mx-4">
              <div className="relative bg-[#3B00CC]/90 rounded-xl p-6 overflow-y-auto max-h-[90vh]">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <h3 className={`${playfair.className} text-xl text-white mb-6`}>Edit Profile</h3>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personal Information */}
                    <div>
                      <label className={`${inter.className} block text-white/70 text-sm mb-1`}>First Name</label>
                      <input 
                        type="text" 
                        name="firstName"
                        value={editFormData.firstName || ''}
                        onChange={handleInputChange}
                        className={`${inter.className} w-full bg-[#2800A3]/80 border border-white/20 rounded-lg px-3 py-2 text-white`}
                      />
                    </div>
                    
                    <div>
                      <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Age</label>
                      <input 
                        type="number" 
                        name="age"
                        value={editFormData.age || ''}
                        onChange={handleInputChange}
                        className={`${inter.className} w-full bg-[#2800A3]/80 border border-white/20 rounded-lg px-3 py-2 text-white`}
                      />
                    </div>
                    
                    <div>
                      <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Suburb</label>
                      <input 
                        type="text" 
                        name="suburb"
                        value={editFormData.suburb || ''}
                        onChange={handleInputChange}
                        className={`${inter.className} w-full bg-[#2800A3]/80 border border-white/20 rounded-lg px-3 py-2 text-white`}
                      />
                    </div>
                    
                    <div>
                      <label className={`${inter.className} block text-white/70 text-sm mb-1`}>State</label>
                      <select 
                        name="state"
                        value={editFormData.state || ''}
                        onChange={handleInputChange}
                        className={`${inter.className} w-full bg-[#2800A3]/80 border border-white/20 rounded-lg px-3 py-2 text-white`}
                      >
                        <option value="">Select state</option>
                        <option value="NSW">New South Wales</option>
                        <option value="VIC">Victoria</option>
                        <option value="QLD">Queensland</option>
                        <option value="WA">Western Australia</option>
                        <option value="SA">South Australia</option>
                        <option value="TAS">Tasmania</option>
                        <option value="ACT">Australian Capital Territory</option>
                        <option value="NT">Northern Territory</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Profession</label>
                      <input 
                        type="text" 
                        name="profession"
                        value={editFormData.profession || ''}
                        onChange={handleInputChange}
                        className={`${inter.className} w-full bg-[#2800A3]/80 border border-white/20 rounded-lg px-3 py-2 text-white`}
                      />
                    </div>
                  </div>
                  
                  {/* Lifestyle Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Relationship Status</label>
                      <select 
                        name="relationshipStatus"
                        value={editFormData.relationshipStatus || ''}
                        onChange={handleInputChange}
                        className={`${inter.className} w-full bg-[#2800A3]/80 border border-white/20 rounded-lg px-3 py-2 text-white`}
                      >
                        <option value="">Select status</option>
                        <option value="Single">Single</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Separated">Separated</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Height</label>
                      <input 
                        type="text" 
                        name="height"
                        value={editFormData.height || ''}
                        onChange={handleInputChange}
                        className={`${inter.className} w-full bg-[#2800A3]/80 border border-white/20 rounded-lg px-3 py-2 text-white`}
                      />
                    </div>
                    
                    <div>
                      <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Smoking Status</label>
                      <select 
                        name="smokingStatus"
                        value={editFormData.smokingStatus || ''}
                        onChange={handleInputChange}
                        className={`${inter.className} w-full bg-[#2800A3]/80 border border-white/20 rounded-lg px-3 py-2 text-white`}
                      >
                        <option value="">Select status</option>
                        <option value="Non-smoker">Non-smoker</option>
                        <option value="Occasionally (socially or on rare occasions)">Occasionally</option>
                        <option value="Regular smoker">Regular smoker</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Drinking Habits</label>
                      <select 
                        name="drinkingHabits"
                        value={editFormData.drinkingHabits || ''}
                        onChange={handleInputChange}
                        className={`${inter.className} w-full bg-[#2800A3]/80 border border-white/20 rounded-lg px-3 py-2 text-white`}
                      >
                        <option value="">Select habits</option>
                        <option value="Non-drinker">Non-drinker</option>
                        <option value="Social drinker">Social drinker</option>
                        <option value="Regular drinker">Regular drinker</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Children Information */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Children</label>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            id="hasChildren" 
                            name="hasChildren"
                            value="true"
                            checked={editFormData.hasChildren === true || (editFormData.hasChildren === undefined && userData?.hasChildren === true)}
                            onChange={() => setEditFormData(prev => ({ ...prev, hasChildren: true }))}
                            className="mr-2"
                          />
                          <label htmlFor="hasChildren" className="text-white">Yes</label>
                        </div>
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            id="noChildren" 
                            name="hasChildren"
                            value="false"
                            checked={editFormData.hasChildren === false || (editFormData.hasChildren === undefined && userData?.hasChildren === false)}
                            onChange={() => setEditFormData(prev => ({ ...prev, hasChildren: false }))}
                            className="mr-2"
                          />
                          <label htmlFor="noChildren" className="text-white">No</label>
                        </div>
                      </div>
                    </div>
                    
                    {(editFormData.hasChildren || (editFormData.hasChildren === undefined && userData?.hasChildren)) && (
                      <div>
                        <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Children Details</label>
                        <input 
                          type="text" 
                          name="childrenAges"
                          placeholder="e.g., 14yo Boy, 6yo Girl"
                          value={editFormData.childrenAges || ''}
                          onChange={handleInputChange}
                          className={`${inter.className} w-full bg-[#2800A3]/80 border border-white/20 rounded-lg px-3 py-2 text-white`}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Interests */}
                  <div>
                    <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Interests (comma separated)</label>
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        name="interestsInput"
                        placeholder="e.g., Reading, Travel, Fitness"
                        value={editFormData.interestsInput || ''}
                        onChange={(e) => {
                          setEditFormData(prev => ({
                            ...prev,
                            interestsInput: e.target.value
                          }));
                        }}
                        onKeyDown={(e) => {
                          // Add interest on comma or Enter key
                          if (e.key === ',' || e.key === 'Enter') {
                            e.preventDefault();
                            
                            if (!editFormData.interestsInput?.trim()) return;
                            
                            // If comma was pressed, split by comma and add all valid interests
                            const inputInterests = editFormData.interestsInput.split(',');
                            const validInterests = inputInterests.map(i => i.trim()).filter(i => i !== '');
                            
                            if (validInterests.length === 0) return;
                            
                            const currentInterests = [...(editFormData.interests || userData?.interests || [])];
                            const newInterests = [...currentInterests];
                            
                            // Add each valid interest if it doesn't already exist
                            validInterests.forEach(interest => {
                              if (!newInterests.includes(interest)) {
                                newInterests.push(interest);
                              }
                            });
                            
                            setEditFormData(prev => ({
                              ...prev,
                              interests: newInterests,
                              interestsInput: ''
                            }));
                          }
                        }}
                        className={`${inter.className} w-full bg-[#2800A3]/80 border border-white/20 rounded-lg px-3 py-2 text-white`}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(editFormData.interests || userData?.interests || []).map((interest, index) => (
                          <div key={index} className="bg-white/20 text-white rounded-full px-3 py-1 text-sm flex items-center gap-1">
                            <span>{interest}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                const newInterests = [...(editFormData.interests || userData?.interests || [])].filter((_, i) => i !== index);
                                setEditFormData(prev => ({
                                  ...prev,
                                  interests: newInterests
                                }));
                              }}
                              className="text-white/70 hover:text-white"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          if (!editFormData.interestsInput?.trim()) return;
                          
                          const newInterest = editFormData.interestsInput.trim();
                          const currentInterests = [...(editFormData.interests || userData?.interests || [])];
                          
                          if (!currentInterests.includes(newInterest)) {
                            setEditFormData(prev => ({
                              ...prev,
                              interests: [...currentInterests, newInterest],
                              interestsInput: ''
                            }));
                          }
                        }}
                        className="mt-2 px-3 py-1 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all text-sm flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Interest</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Personal Summary */}
                  <div>
                    <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Personal Summary</label>
                    <textarea 
                      name="personalSummary"
                      rows={4}
                      value={editFormData.personalSummary || ''}
                      onChange={handleInputChange}
                      className={`${inter.className} w-full bg-[#2800A3]/80 border border-white/20 rounded-lg px-3 py-2 text-white`}
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className={`${inter.className} px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors`}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleEditProfile}
                      disabled={isSaving}
                      className={`${inter.className} px-4 py-2 bg-[#3B00CC] text-white rounded-lg hover:bg-[#3B00CC]/90 transition-colors flex items-center ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* Edit buttons removed from top for desktop */}
        
        {/* Desktop logo at top center with back arrow */}
        <div className="hidden lg:flex lg:justify-center lg:mt-6 lg:mb-8 lg:relative">
          {/* Back arrow for desktop */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-3.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center gap-3 shadow-md"
              aria-label="Go back to dashboard"
            >
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-white text-base font-medium pr-1">Back</span>
            </button>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-40 h-12 relative">
              <Image 
                src="/vettly-logo.png" 
                alt="Vettly Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <Tagline />
          </div>
        </div>
        
        {/* Mobile only: Back arrow and Vettly logo */}
        <div className="flex flex-col mt-4 mb-6 lg:hidden">
          {/* Back arrow button */}
          <div className="absolute top-6 left-4 z-20">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all shadow-md"
              aria-label="Go back to dashboard"
            >
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          {/* Logo and tagline */}
          <div className="flex flex-col items-center justify-center w-full">
            <div className="w-32 h-10 relative">
              <Image 
                src="/vettly-logo.png" 
                alt="Vettly Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="w-full flex justify-center mt-1">
              <Tagline />
            </div>
          </div>
        </div>
        

        
        {/* Mobile only: Profile image and back button */}
        <div className="lg:hidden relative">

          
          <div className="w-full aspect-[3/2.5] relative overflow-hidden rounded-3xl mt-16 group">
            {/* Main profile image */}
            <Image 
              src={(userData.photos && userData.photos.length > 0) 
                ? userData.photos[currentPhotoIndex] 
                : (userData.profilePhotoUrl || '/placeholder-profile.jpg')}
              alt={`${userData.firstName}'s profile`}
              fill
              className="object-cover object-top"
              unoptimized
            />
            
            {/* Navigation arrows for photo gallery - only show if there are multiple photos */}
            {userData.photos && userData.photos.length > 1 && (
              <>
                {/* Left arrow */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the parent onClick
                    setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : userData.photos!.length - 1));
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2.5 rounded-full bg-gray-200/80 backdrop-blur-sm text-gray-700 hover:bg-gray-300/90 transition-all z-10 shadow-md"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                  </svg>
                </button>
                
                {/* Right arrow */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the parent onClick
                    setCurrentPhotoIndex(prev => (prev < userData.photos!.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2.5 rounded-full bg-gray-200/80 backdrop-blur-sm text-gray-700 hover:bg-gray-300/90 transition-all z-10 shadow-md"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                  </svg>
                </button>
              </>
            )}
            
            {/* No overlay - removed as requested */}
          </div>
          
          {/* Mobile Edit buttons below profile image */}
          <div className="flex justify-center gap-3 mt-4 mb-8">
            <button 
              onClick={() => router.push('/profile/images')}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all flex items-center gap-1.5"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Edit Photos</span>
            </button>
            <button 
              onClick={() => {
                initializeEditForm();
                setShowEditModal(true);
              }}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all flex items-center gap-1.5"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-sm">Edit Profile</span>
            </button>
          </div>
        </div>
        
        {/* Desktop layout: Two-column with profile on left */}
        <div className="flex flex-col lg:flex-row lg:gap-12 lg:mt-36 lg:items-start lg:min-h-[calc(100vh-200px)] lg:py-12">
          {/* Left column: Profile picture and basic info - desktop only */}
          <div className="hidden lg:flex lg:flex-col lg:w-1/5 lg:self-start lg:pt-0">

            
            {/* Profile image */}
            <div className="w-full aspect-square relative overflow-hidden rounded-3xl lg:mt-[6rem] group">
              {/* Main profile image */}
              <Image 
                src={(userData.photos && userData.photos.length > 0) 
                  ? userData.photos[currentPhotoIndex] 
                  : (userData.profilePhotoUrl || '/placeholder-profile.jpg')}
                alt={`${userData.firstName}'s profile`}
                fill
                className="object-cover object-top"
                unoptimized
              />
              
              {/* Navigation arrows for photo gallery - only show if there are multiple photos */}
              {userData.photos && userData.photos.length > 1 && (
                <>
                  {/* Left arrow */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent onClick
                      setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : userData.photos!.length - 1));
                    }}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-gray-200/80 backdrop-blur-sm text-gray-700 hover:bg-gray-300/90 transition-all z-10 shadow-md"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                  </button>
                  
                  {/* Right arrow */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent onClick
                      setCurrentPhotoIndex(prev => (prev < userData.photos!.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-gray-200/80 backdrop-blur-sm text-gray-700 hover:bg-gray-300/90 transition-all z-10 shadow-md"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* No overlay - removed as requested */}
            </div>
            

            
            {/* Name and location */}
            <div className="mt-4 bg-white/15 backdrop-blur-md rounded-[20px] p-4">
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <span className={`${playfair.className} text-[2rem] font-bold text-[#73FFF6]`}>{userData.firstName},</span>
                  <span className={`${playfair.className} text-[1.8rem] text-[#73FFF6] ml-2`} style={{position: 'relative', top: '-2px'}}>
                    {calculateAge(userData.dob || userData.questionnaireAnswers?.personal_dob) || 
                     userData.questionnaireAnswers?.personal_age || 
                     userData.age || 
                     'Not specified'}
                  </span>
                </div>
                <p className={`${playfair.className} text-[#73FFF6] text-2xl mt-2 mb-4 font-medium`}>{userData.location || `${userData.suburb || 'Sydney'}, ${userData.state || 'NSW'}`}</p>
              </div>
            </div>
            
            {/* Desktop edit buttons moved under name and location box */}
            <div className="hidden lg:flex mt-4 gap-3 justify-center">
              <button 
                onClick={() => router.push('/profile/images')}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all flex items-center gap-1.5"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Edit Photos</span>
              </button>
              <button 
                onClick={() => {
                  initializeEditForm();
                  setShowEditModal(true);
                }}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all flex items-center gap-1.5"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="text-sm">Edit Profile</span>
              </button>
            </div>
          </div>
          
          {/* Right column: Main content */}
          <div className="lg:w-4/5 lg:flex lg:flex-col lg:justify-start">
            {/* Info section with glass morphism background */}
            <div className="relative mt-4 lg:mt-0 bg-white/15 backdrop-blur-md rounded-[40px] lg:rounded-[20px] flex-1 px-7 py-6 lg:mr-32">
              {/* Mobile only: Name and location */}
              <div className="lg:hidden mb-4 flex justify-between items-start">
                <div>
                <div className="flex items-baseline">
                  <span className={`${playfair.className} text-[2.5rem] font-bold text-[#3B00CC]`}>{userData.firstName},</span>
                  <span className={`${playfair.className} text-[2.2rem] text-[#3B00CC] ml-2`} style={{position: 'relative', top: '-4px'}}>
                    {calculateAge(userData.dob || userData.questionnaireAnswers?.personal_dob) || 
                     userData.questionnaireAnswers?.personal_age || 
                     userData.age || 
                     'Not specified'}
                  </span>
                </div>
                <p className={`${playfair.className} text-[#3B00CC] text-2xl mt-2 mb-4 font-medium`}>{userData.location || `${userData.suburb || 'Sydney'}, ${userData.state || 'NSW'}`}</p>
                </div>
                
                {/* No Edit button here anymore */}
              </div>
              
              {/* Two-column layout for desktop */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">
                {/* Column 1: Details */}
                <div className="lg:flex lg:flex-col lg:justify-end">
                  {/* Details with icons */}
                  <div className="mb-6 bg-white/10 backdrop-blur-md rounded-2xl p-5">
                    <h2 className="text-2xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Details</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-y-4 gap-x-8">
                      {/* Career Section */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-[#3B00CC] uppercase tracking-wide">Career</h3>
                        <div className="flex items-center gap-3 bg-white/6 backdrop-blur-sm p-3 rounded-lg">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            {/* Career: Briefcase icon */}
<svg className="h-5 w-5 text-[#3B00CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7V6a3 3 0 013-3h6a3 3 0 013 3v1m2 0a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2h16zm-6 4h.01" />
</svg>
                          </div>
                          <div>
                            <p className="text-xs text-white/70">Profession</p>
                            <p className="text-white font-medium" style={{fontFamily: inter.style.fontFamily}}>
                              {userData.questionnaireAnswers?.lifestyle_profession || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Relationship Section */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-[#3B00CC] uppercase tracking-wide">Relationship</h3>
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            {/* Relationship: Heart icon */}
                            <svg className="h-5 w-5 text-[#3B00CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-white/70">Status</p>
                            <p className="text-white font-medium" style={{fontFamily: inter.style.fontFamily}}>
                              {userData.maritalStatus || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Lifestyle Section */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-[#3B00CC] uppercase tracking-wide">Lifestyle</h3>
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            {/* Lifestyle: Smoking (premade icon) */}
                            <SmokingIcon />
                          </div>
                          <div>
                            <p className="text-xs text-white/70">Smoking</p>
                            <p className="text-white font-medium" style={{fontFamily: inter.style.fontFamily}}>
                              {formatSmokingHabit(userData.questionnaireAnswers?.lifestyle_smoking)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-lg mt-3">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            {/* Lifestyle: Wine glass icon for Drinking */}
                            <WineIcon />
                          </div>
                          <div>
                            <p className="text-xs text-white/70">Drinking</p>
                            <p className="text-white font-medium" style={{fontFamily: inter.style.fontFamily}}>
                              {formatDrinkingHabit(userData.questionnaireAnswers?.lifestyle_alcohol)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Physical & Family Section */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-[#3B00CC] uppercase tracking-wide">Physical & Family</h3>
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            {/* Physical & Family: Arrow Up icon for Height */}
                            <svg className="h-5 w-5 text-[#3B00CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-white/70">Height</p>
                            <p className="text-white font-medium" style={{fontFamily: inter.style.fontFamily}}>
                              {userData.questionnaireAnswers?.attraction_height || 'Not specified'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-lg mt-3">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            {/* Physical & Family: Family icon for Children */}
                            <svg className="h-5 w-5 text-[#3B00CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-white/70">Children</p>
                            <p className="text-white font-medium" style={{fontFamily: inter.style.fontFamily}}>
                              {userData ? formatChildrenInfo(userData) : 'Loading...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Column 2: Interests and Personal Summary */}
                <div className="lg:flex lg:flex-col lg:justify-end">
                  {/* Interests section with pill boxes */}
                  <div className="mt-8 lg:mt-0 mb-4">
                    <h2 className="text-2xl font-semibold text-white mb-4">Interests</h2>
                    <div className="flex flex-wrap gap-2 w-full">
                      {userData.questionnaireAnswers?.lifestyle_hobbiesTypes && userData.questionnaireAnswers.lifestyle_hobbiesTypes.length > 0 ? (
                        userData.questionnaireAnswers.lifestyle_hobbiesTypes.map((interest: string, index: number) => (
                          <div key={index} className="bg-white/90 text-[#3B00CC] rounded-full text-sm font-medium shadow-sm flex items-center justify-center px-4 py-2 whitespace-nowrap">
                            {interest}
                          </div>
                        ))
                      ) : (
                        <div className="w-full text-white text-sm py-2">
                          No interests found in your questionnaire responses.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Personal Summary section */}
                  <div className="mt-8 mb-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">Personal Summary</h2>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 w-full">
                      <p className="text-white text-sm leading-relaxed" style={{fontFamily: inter.style.fontFamily}}>
                        {userData.personalSummary || "Bob, you're an extroverted, spontaneous individual with a calm and grounded personality. You love reading, enjoy mixing things up, and have a high regard for health. As a lawyer, you've learned the importance of balance - between work and personal life, and also in relationships, where you appreciate a blend of independence and togetherness. You value self-awareness, empathy, and optimism in your partner and look for honesty above all. In relationships, you're all in, ready to support your partner financially while expecting the same degree of emotional connection. You're a person who addresses conflicts straight away and prefers to take the lead but makes decisions logically, considering all pros and cons. Physical attraction and intimacy are crucial to you, and you're open to your partner's choices in cosmetic enhancements. For you, it's important that your partner doesn't have children from previous relationships. You're comfortable with your partner's occasional social use of drugs or alcohol, provided it's respectful. You also value your alone time to recharge and handle stress."}
                      </p>
                      {/* No Summarize Again button as requested */}
                      {!userData.personalSummary && (
                        <button 
                          className="mt-4 px-5 py-2.5 bg-[#34D8F1] text-white rounded-lg text-sm font-medium hover:bg-[#34D8F1]/80 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center w-full shadow-sm"
                        >
                          Generate Summary
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gap to show background before navigation */}
      <div className="h-28"></div>
      
      {/* Desktop Side Navigation */}
      <div className="hidden lg:flex fixed right-0 top-0 h-full flex-col items-center justify-center py-6 px-3 bg-[#73FFF6]/95 backdrop-blur-xl border-l border-white/20 z-50">
        <div className="flex flex-col gap-10">
          {[
            { id: 'dashboard', icon: (
              <svg className="w-8 h-8" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )},
            { id: 'messages', icon: (
              <svg className="w-8 h-8" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            )},
            { id: 'matches', icon: (
              <svg className="w-8 h-8" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            )},
            { id: 'settings', icon: (
              <svg className="w-8 h-8" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            )}
          ].map((item) => (
            <button
              key={item.id}
              className={`p-4 rounded-xl transition-all ${
                item.id === 'settings'
                  ? 'bg-white/25 text-white'
                  : 'text-white hover:text-white hover:bg-white/20'
              }`}
              onClick={() => {
                router.push(`/${item.id === 'dashboard' ? '' : item.id}`);
              }}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-center py-2 px-4 bg-[#73FFF6]/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex gap-10">
          {[
            { id: 'dashboard', icon: (
              <svg className="w-6 h-6" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )},
            { id: 'messages', icon: (
              <svg className="w-6 h-6" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            )},
            { id: 'matches', icon: (
              <svg className="w-6 h-6" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            )},
            { id: 'settings', icon: (
              <svg className="w-6 h-6" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            )}
          ].map((item) => (
            <button
              key={item.id}
              className={`p-2 rounded-lg transition-all ${
                item.id === 'settings'
                  ? 'bg-white/25 text-white'
                  : 'text-white hover:text-white hover:bg-white/20'
              }`}
              onClick={() => {
                router.push(`/${item.id === 'dashboard' ? '' : item.id}`);
              }}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation activeTab={activeTab} />
    </div>
  );
}
