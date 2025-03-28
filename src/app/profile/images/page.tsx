'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { inter, playfair } from '@/app/fonts';
import { OrbField } from '@/app/components/gradients/OrbField';
import { BsFillPersonFill } from 'react-icons/bs';
import { GiDress } from 'react-icons/gi';
import { IoBody } from 'react-icons/io5';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase-init';
import { updateProfile } from 'firebase/auth';

interface ImageUpload {
  type: 'face' | 'fullBody' | 'style' | 'hobby';
  file: File | null;
  preview: string;
}

const imageTypes = {
  face: {
    title: 'Face Photo',
    icon: BsFillPersonFill,
    description: 'A clear photo of your face'
  },
  fullBody: {
    title: 'Full Body Shot',
    icon: IoBody,
    description: 'Show your full appearance'
  },
  style: {
    title: 'Personal Style',
    icon: GiDress,
    description: 'Express your fashion sense'
  },
  hobby: {
    title: 'Something You Love',
    icon: FaHeart,
    description: 'Share your interests'
  }
};

export default function ProfileImages() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<Record<string, ImageUpload>>({
    face: { type: 'face', file: null, preview: '' },
    fullBody: { type: 'fullBody', file: null, preview: '' },
    style: { type: 'style', file: null, preview: '' },
    hobby: { type: 'hobby', file: null, preview: '' },
  });

  useEffect(() => {
    if (!currentUser) {
      console.log('No user logged in, redirecting to login...');
      router.push('/login');
    }
  }, [currentUser, router]);

  const handleImageUpload = async (type: keyof typeof imageTypes, file: File) => {
    console.log(`Uploading ${type} image:`, file);
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log(`Preview generated for ${type} image`);
      setImages((prev) => ({
        ...prev,
        [type]: {
          type,
          file,
          preview: e.target?.result as string,
        } as ImageUpload,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    setError(null);
    
    if (!currentUser) {
      setError('No user logged in');
      console.error('No user logged in');
      return;
    }

    if (!storage) {
      setError('Storage not initialized');
      console.error('Storage not initialized');
      return;
    }

    if (!images.face.file) {
      setError('Please upload a face photo');
      console.error('No face photo uploaded');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Starting image upload process...');
      console.log('Current images state:', JSON.stringify(images, null, 2));
      
      // Upload face photo first and set as profile picture
      console.log('Uploading face photo...');
      
      if (!storage) {
        throw new Error('Storage not initialized');
      }

      if (!images.face.file) {
        throw new Error('No face photo file selected');
      }

      try {
        // Create a simple reference with timestamp to avoid conflicts
        const timestamp = Date.now();
        const faceRef = ref(storage, `users/${currentUser.uid}/profile_${timestamp}.jpg`);
        console.log('Face photo reference created:', faceRef);

        // Create a new File instance with the correct type
        const imageFile = new File([images.face.file], 'profile.jpg', {
          type: 'image/jpeg'
        });
        
        // Create upload task with the File and proper metadata
        const metadata = {
          contentType: 'image/jpeg',
          customMetadata: {
            'Access-Control-Allow-Origin': '*'
          }
        };
        
        const uploadTask = uploadBytesResumable(faceRef, imageFile, metadata);

        // Monitor the upload
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload progress:', progress + '%');
            console.log('Current state:', snapshot.state);
            console.log('Bytes transferred:', snapshot.bytesTransferred);
            console.log('Total bytes:', snapshot.totalBytes);
          },
          (error) => {
            console.error('Upload error details:', {
              name: error.name,
              code: error.code,
              message: error.message,
              serverResponse: error.serverResponse,
              stack: error.stack
            });
            throw error;
          },
          () => {
            console.log('Upload completed successfully');
          }
        );

        // Wait for upload to complete
        const snapshot = await uploadTask;
        console.log('Upload snapshot:', snapshot);
        
        const faceUrl = await getDownloadURL(faceRef);
        console.log('Face photo URL:', faceUrl);
        
        // Update user profile with face photo URL
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          profilePhotoUrl: faceUrl
        });
        console.log('Updated user document with face photo URL');

        // Also update auth user photoURL
        await updateProfile(currentUser, {
          photoURL: faceUrl
        });
        console.log('Updated auth user photoURL');
      } catch (uploadError: any) {
        console.error('Detailed upload error:', {
          code: uploadError.code,
          message: uploadError.message,
          serverResponse: uploadError.serverResponse,
          name: uploadError.name,
          stack: uploadError.stack
        });
        throw uploadError;
      }

      // Upload other images
      const uploadPromises = Object.entries(images).map(async ([type, image]) => {
        if (type !== 'face' && image.file) {
          if (!storage) {
            throw new Error('Storage not initialized');
          }
          const imageRef = ref(storage, `users/${currentUser.uid}/${type}.jpg`);
          
          const uploadTask = uploadBytesResumable(imageRef, image.file, {
            contentType: 'image/jpeg',
            customMetadata: {
              'Access-Control-Allow-Origin': '*'
            }
          });

          // Monitor upload progress
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`${type} upload progress:`, progress + '%');
            },
            (error) => {
              console.error(`${type} upload error:`, error);
              throw error;
            }
          );

          // Wait for upload to complete
          await uploadTask;
          console.log(`${type} upload completed successfully`);
          
          const url = await getDownloadURL(imageRef);
          console.log(`${type} photo URL:`, url);
          
          // Update user document with image URL
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            [`${type}PhotoUrl`]: url
          });
        }
      });

      await Promise.all(uploadPromises);
      console.log('All images uploaded');

      console.log('Redirecting to dashboard...');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error uploading images:', error);
      if (error instanceof Error) {
        setError(error.message);
        console.error('Error details:', error.message, error.stack);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex items-start">
      <OrbField />
      {/* Purple orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-500/30 to-purple-600/30 blur-3xl" />
      
      <div className="relative z-10 w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-8">
            <Image
              src="/vettly-logo.png"
              alt="Vettly Logo"
              width={180}
              height={45}
              className="h-auto w-auto"
              priority
            />
          </div>

          <div className="text-center mb-12">
            <h2 className={`${playfair.className} text-4xl font-bold text-white mb-3`}>
              Upload Your Photos
            </h2>
            <p className={`${inter.className} text-lg text-white/80`}>
              Help others get to know you better with these 4 essential photos
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-white">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 mb-8">
            <div className="grid grid-cols-1 gap-4 sm:gap-8 sm:grid-cols-2 max-w-[320px] sm:max-w-none mx-auto">
              {Object.entries(imageTypes).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <div
                    key={key}
                    className={`${inter.className} relative aspect-square backdrop-blur-md bg-white/15 rounded-xl border border-white/30 p-3 transition-all duration-200 group overflow-hidden hover:bg-white/20 hover:border-white/40`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(key as keyof typeof imageTypes, file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="text-center relative z-1 h-full flex flex-col items-center justify-center">
                      {images[key].preview ? (
                        <div className="relative w-full h-full overflow-hidden rounded-lg">
                          <Image
                            src={images[key].preview}
                            alt={info.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="transform group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full w-full group-hover:bg-white/5 transition-colors duration-200">
                          <Icon className="h-14 w-14 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-200 mb-3" />
                          <span className="text-lg font-medium text-white group-hover:text-cyan-300 transition-colors duration-200">
                            {info.title}
                          </span>
                          <span className="text-sm text-white/70 mt-1">
                            {info.description}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${inter.className} inline-flex justify-center items-center py-3 px-6 shadow-lg shadow-cyan-500/30 text-base font-semibold rounded-full text-white bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
