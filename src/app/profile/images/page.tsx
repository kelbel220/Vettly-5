'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { inter } from '@/app/fonts';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase-init';
import { updateProfile } from 'firebase/auth';
import { OrbField } from '@/app/components/gradients/OrbField';
import { FaUpload, FaTimes, FaCamera } from 'react-icons/fa';

const photoTypes = {
  face: {
    title: 'Photo 1',
    fieldName: 'profilePhotoUrl'
  },
  fullBody: {
    title: 'Photo 2',
    fieldName: 'fullBodyPhotoUrl'
  },
  style: {
    title: 'Photo 3',
    fieldName: 'stylePhotoUrl'
  },
  hobby: {
    title: 'Photo 4',
    fieldName: 'hobbyPhotoUrl'
  }
};

export default function ProfileImages() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>({
    face: '',
    fullBody: '',
    style: '',
    hobby: ''
  });
  const fileInputRefs = {
    face: useRef<HTMLInputElement>(null),
    fullBody: useRef<HTMLInputElement>(null),
    style: useRef<HTMLInputElement>(null),
    hobby: useRef<HTMLInputElement>(null)
  };

  useEffect(() => {
    if (!currentUser) {
      console.log('No user logged in, redirecting to login...');
      router.push('/login');
      return;
    }
    
    console.log('Current user:', currentUser.uid);
    
    // Load existing images from user profile
    const loadUserImages = async () => {
      try {
        console.log('Loading user images...');
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          console.log('User document exists');
          const userData = userSnap.data();
          console.log('User data:', userData);
          
          const photos = {
            face: userData.profilePhotoUrl || '',
            fullBody: userData.fullBodyPhotoUrl || '',
            style: userData.stylePhotoUrl || '',
            hobby: userData.hobbyPhotoUrl || ''
          };
          
          console.log('Loaded photos:', photos);
          setUserPhotos(photos);
        } else {
          console.log('User document does not exist');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading user images:', error);
        setLoading(false);
      }
    };
    
    loadUserImages();
  }, [currentUser, router]);

  const handleFileSelect = (type: keyof typeof photoTypes) => {
    if (fileInputRefs[type]?.current) {
      fileInputRefs[type].current?.click();
    }
  };

  const handleFileChange = async (type: keyof typeof photoTypes, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !storage) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Create a reference with timestamp to avoid conflicts
      const timestamp = Date.now();
      const path = `users/${currentUser.uid}/${type}_${timestamp}.jpg`;
      const imageRef = ref(storage, path);
      
      // Upload the file
      const uploadTask = uploadBytesResumable(imageRef, file, {
        contentType: 'image/jpeg'
      });
      
      // Set up the observer for the upload task
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress tracking if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error('Upload failed:', error);
          setError('Upload failed. Please try again.');
          setLoading(false);
        },
        async () => {
          // Handle successful uploads
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update Firestore document
          const userRef = doc(db, 'users', currentUser.uid);
          const fieldName = photoTypes[type].fieldName;
          
          await updateDoc(userRef, {
            [fieldName]: downloadURL
          });
          
          // If it's the face photo, also update auth profile
          if (type === 'face') {
            await updateProfile(currentUser, {
              photoURL: downloadURL
            });
          }
          
          // Update local state
          setUserPhotos(prev => ({
            ...prev,
            [type]: downloadURL
          }));
          
          setLoading(false);
          
          // Redirect to dashboard after successful upload
          router.push('/dashboard');
        }
      );
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
      setLoading(false);
    }
  };
  
  const handleDeletePhoto = async (type: keyof typeof photoTypes) => {
    console.log('Delete photo triggered for:', type);
    console.log('Current photo URL:', userPhotos[type]);
    
    if (!currentUser) {
      console.error('No user logged in');
      return;
    }
    
    if (!userPhotos[type]) {
      console.error('No photo URL to delete');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // First, update local state immediately for better UX
      setUserPhotos(prev => {
        const newState = {
          ...prev,
          [type]: ''
        };
        console.log('Updated local state immediately:', newState);
        return newState;
      });
      
      // Get the field name based on type
      const fieldName = photoTypes[type].fieldName;
      console.log('Field name to update:', fieldName);
      
      // Try to delete from Firebase Storage if possible
      // Extract the file path from the URL if it's a Firebase Storage URL
      const photoUrl = userPhotos[type];
      if (photoUrl && photoUrl.includes('firebasestorage.googleapis.com') && storage) {
        try {
          console.log('Attempting to delete file from Firebase Storage');
          // Try to extract the path from the URL
          const urlObj = new URL(photoUrl);
          const pathWithQuery = urlObj.pathname;
          // Remove the /o/ prefix and decode the path
          const path = decodeURIComponent(pathWithQuery.replace(/^\/o\//, ''));
          console.log('Extracted storage path:', path);
          
          // Create a reference to the file
          const fileRef = ref(storage, path);
          await deleteObject(fileRef).catch(error => {
            console.warn('Could not delete from storage, might be a reference issue:', error);
            // Continue anyway as we still want to remove the reference
          });
          console.log('File deleted from storage or not found');
        } catch (storageError) {
          console.warn('Error during storage deletion, continuing with reference removal:', storageError);
          // We still continue to update the document reference
        }
      }
      
      // Update Firestore document to remove the URL
      const userRef = doc(db, 'users', currentUser.uid);
      console.log('Updating Firestore document for user:', currentUser.uid);
      
      await updateDoc(userRef, {
        [fieldName]: ''
      });
      console.log('Firestore document updated successfully');
      
      // If it's the face photo, also update auth profile
      if (type === 'face') {
        console.log('Updating auth profile photo URL');
        await updateProfile(currentUser, {
          photoURL: ''
        });
        console.log('Auth profile updated successfully');
      }
      
      console.log('Photo deleted successfully');
      setLoading(false);
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image. Please try again.');
      // Restore the photo in local state if there was an error
      setUserPhotos(prev => ({ ...prev }));
      setLoading(false);
    }
  };

  if (loading && !userPhotos.face && !userPhotos.fullBody && !userPhotos.style && !userPhotos.hobby) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden">
        {/* Background container with fixed position to cover entire viewport */}
        <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
          <div className="absolute inset-0 overflow-hidden">
            <OrbField />
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-screen">
          <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse mb-8" />
          <div className="h-4 w-32 bg-white/10 animate-pulse mb-4 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Background container with fixed position to cover entire viewport */}
      <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
        <div className="absolute inset-0 overflow-hidden">
          <OrbField />
        </div>
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col pb-[80px] lg:pb-0">
        {/* Content Container */}
        <div className="relative h-full z-10">
          <div className="h-full overflow-y-auto px-4 py-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="/vettly-logo.png"
                alt="Vettly Logo"
                width={120}
                height={30}
                className=""
                priority
              />
            </div>
            
            {/* Photos Section */}
            <section className="max-w-6xl mx-auto mb-12">
              <h2 className="text-4xl font-bold text-white mb-8 text-center">Your Photos</h2>
              
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-lg mb-6">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(photoTypes).map(([type, config]) => {
                  const photoType = type as keyof typeof photoTypes;
                  return (
                    <div key={type} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden">
                      {/* Hidden file input */}
                      <input
                        type="file"
                        ref={fileInputRefs[photoType]}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange(photoType, e)}
                      />
                      
                      <div className="aspect-square relative">
                        {userPhotos[photoType] ? (
                          // Photo exists - show with delete and change options
                          <div className="w-full h-full">
                            {/* Photo */}
                            <div className="relative w-full h-full">
                              <Image
                                src={userPhotos[photoType]}
                                alt={config.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            
                            {/* No photo title - removed as requested */}
                            
                            {/* Action buttons container */}
                            <div className="absolute top-0 right-0 p-2 flex gap-2">
                              {/* Delete button - now cyan instead of red */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeletePhoto(photoType);
                                }}
                                className="w-8 h-8 rounded-full bg-[#73FFF6] text-[#3B00CC] flex items-center justify-center hover:bg-[#73FFF6]/90 transition-colors shadow-md"
                                aria-label="Delete photo"
                              >
                                <FaTimes />
                              </button>
                            </div>
                            
                            {/* Change button - separate from delete to avoid conflicts */}
                            <button 
                              className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-1 hover:bg-blue-600 transition-colors shadow-md"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleFileSelect(photoType);
                              }}
                              style={{fontFamily: inter.style.fontFamily}}
                            >
                              <FaUpload className="mr-1" />
                              <span>Change</span>
                            </button>
                          </div>
                        ) : (
                          // No photo - show upload option
                          <button 
                            className="w-full h-full flex flex-col items-center justify-center bg-white/5 cursor-pointer hover:bg-white/10 transition-colors border-none"
                            onClick={(e) => {
                              e.preventDefault();
                              handleFileSelect(photoType);
                            }}
                          >
                            <FaCamera className="text-4xl text-white/40 mb-2" />
                            <p className="text-white font-medium">{config.title}</p>
                            <div className="mt-3 bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-1 hover:bg-blue-600 transition-colors" style={{fontFamily: inter.style.fontFamily}}>
                              <FaUpload className="mr-1" />
                              <span>Upload</span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Bottom Done button */}
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => router.push('/profile')}
                  className="px-16 py-3 bg-[#3E00FF] text-white rounded-full hover:bg-[#3E00FF]/90 transition-colors flex items-center gap-2 shadow-md text-lg font-medium"
                >
                  <span>Done</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
