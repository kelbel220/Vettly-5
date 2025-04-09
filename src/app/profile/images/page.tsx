'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { inter, playfair } from '@/app/fonts';
import Link from 'next/link';
import { OrbField } from '@/app/components/gradients/OrbField';
import { BsFillPersonFill } from 'react-icons/bs';
import { GiTShirt } from 'react-icons/gi';
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
    description: 'A clear photo of your face, no sunglasses and no filters.'
  },
  fullBody: {
    title: 'Full Body Shot',
    icon: IoBody,
    description: 'This helps us understand your overall appearance and body shape.'
  },
  style: {
    title: 'Personal Style',
    icon: GiTShirt,
    description: 'Show what you might wear on a date or nice dinner.'
  },
  hobby: {
    title: 'Something You Love',
    icon: FaHeart,
    description: 'Show your hobbies or lifestyle interests.'
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
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Background container with fixed position to cover entire viewport */}
      <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
        <div className="absolute inset-0 overflow-hidden">
          <OrbField />
        </div>
      </div>
      
      {/* Content container */}
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16" style={{ paddingBottom: '2rem' }}>
        <div className="flex justify-center mb-4">
          <Link href="/">
            <Image 
              src="/vettly-logo.png" 
              alt="Vettly Logo" 
              width={150} 
              height={60} 
              className="h-auto w-auto" 
            />
          </Link>
        </div>
        <div className="max-w-4xl mx-auto mt-24">
          <h1 className={`${playfair.className} text-4xl font-bold text-white text-center mb-6`}>
            Upload Your Photos
          </h1>
          <div className="flex justify-center px-6 sm:px-10 md:px-16 mx-auto">
            <p className={`${inter.className} text-lg text-white/80 text-left mb-12 max-w-xl px-2 py-3`}>
              Upload your photos to help our matchmakers get to know you. There is no public profile and photos are only shared with your match once approved. You can update them anytime.
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 mt-6" style={{ background: 'transparent' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xs md:max-w-none mx-auto mobile-squares">
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
                        <div className="flex flex-col items-center justify-center h-full w-full group-hover:bg-white/5 transition-colors duration-200 px-6">
                          <Icon className="h-14 w-14 text-[#3E00FF] group-hover:text-[#3E00FF]/90 transition-colors duration-200 mb-3" />
                          <span className="text-lg font-medium text-white group-hover:text-[#3E00FF]/90 transition-colors duration-200">
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


            {/* Submit button as part of the form */}
            <div className="flex justify-center mt-8 mb-12">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${inter.className} inline-flex justify-center items-center py-3 px-16 min-w-[180px] shadow-lg shadow-indigo-500/30 text-base font-semibold rounded-full text-white bg-[#3E00FF] hover:bg-[#3E00FF]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3E00FF] transition-all duration-200 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Uploading...' : 'Save & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
