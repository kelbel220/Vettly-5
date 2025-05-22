'use client';

import React from 'react';
import Image from 'next/image';
import { inter } from '../fonts';
import { FaUpload, FaTimes } from 'react-icons/fa';

interface PhotoUploaderProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  initialImage?: string;
  onSave: (file: File) => void;
  onDelete: () => void;
}

export default function PhotoUploader({
  title,
  description,
  icon: Icon,
  initialImage,
  onSave,
  onDelete
}: PhotoUploaderProps) {
  // Simple file input reference
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSave(file);
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`${inter.className} relative aspect-square backdrop-blur-md bg-white/15 rounded-xl border border-white/30 p-3 transition-all duration-200 group overflow-hidden hover:bg-white/20 hover:border-white/40`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="text-center relative z-1 h-full flex flex-col items-center justify-center">
        {initialImage ? (
          // Photo exists - show the photo with delete button
          <div className="relative w-full h-full overflow-hidden rounded-lg">
            {/* The photo */}
            <Image
              src={initialImage}
              alt={title}
              fill
              style={{ objectFit: 'cover' }}
              className="transform transition-transform duration-200"
            />
            
            {/* Delete button (X in top-right corner) */}
            <button 
              onClick={onDelete}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
              aria-label="Delete photo"
            >
              <FaTimes />
            </button>
            
            {/* Upload new button (bottom center) */}
            <button
              onClick={triggerFileInput}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-blue-500 rounded-md text-white text-sm hover:bg-blue-600 transition-colors shadow-md flex items-center space-x-1"
            >
              <FaUpload className="mr-1" />
              <span>Change</span>
            </button>
          </div>
        ) : (
          // No photo - show upload option
          <div className="flex flex-col items-center justify-center h-full w-full">
            <button
              onClick={triggerFileInput}
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
            >
              <Icon className="h-14 w-14 text-[#3E00FF] group-hover:text-[#3E00FF]/90 transition-colors duration-200 mb-3" />
              <span className="text-lg font-medium text-white group-hover:text-[#3E00FF]/90 transition-colors duration-200">
                {title}
              </span>
              <span className="text-sm text-white/70 mt-1 mb-4">
                {description}
              </span>
              <div className="mt-2 px-4 py-2 bg-blue-500 rounded-full text-white flex items-center space-x-1 hover:bg-blue-600 transition-colors">
                <FaUpload className="mr-1" />
                <span>Upload Photo</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
