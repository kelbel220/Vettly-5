'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ImageUpload {
  type: 'face' | 'fullBody' | 'style' | 'hobby';
  file: File | null;
  preview: string;
}

export default function ProfileImages() {
  const router = useRouter();
  const [images, setImages] = useState<Record<string, ImageUpload>>({
    face: { type: 'face', file: null, preview: '' },
    fullBody: { type: 'fullBody', file: null, preview: '' },
    style: { type: 'style', file: null, preview: '' },
    hobby: { type: 'hobby', file: null, preview: '' },
  });

  const imageTypes = {
    face: 'Face Photo',
    fullBody: 'Full Body Shot',
    style: 'Personal Style',
    hobby: 'Something You Love',
  };

  const handleImageUpload = (type: keyof typeof imageTypes, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImages((prev) => ({
        ...prev,
        [type]: {
          type,
          file,
          preview: e.target?.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all images are uploaded
    const allUploaded = Object.values(images).every((img) => img.file);
    if (!allUploaded) {
      alert('Please upload all required images');
      return;
    }

    // Here you would typically upload the images to your backend
    // For now, we'll just move to the next step
    router.push('/profile/complete');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Upload Your Photos</h2>
          <p className="mt-2 text-gray-600">
            Help others get to know you better with these 4 essential photos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {Object.entries(imageTypes).map(([key, title]) => (
              <div
                key={key}
                className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors"
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
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  {images[key].preview ? (
                    <div className="relative h-48 w-full">
                      <Image
                        src={images[key].preview}
                        alt={title}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center">
                      <div>
                        <div className="mx-auto h-12 w-12 text-gray-400">
                          <svg
                            className="h-12 w-12"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="mt-4">
                          <span className="text-sm font-medium text-gray-900">
                            {title}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
