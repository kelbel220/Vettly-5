'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, Timestamp, orderBy, addDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { WeeklyTip, WeeklyTipCategory, createDefaultWeeklyTip, WeeklyTipStatus } from '@/lib/models/weeklyTip';
import { format } from 'date-fns';
import { generateWeeklyTip } from '@/lib/services/openaiTipGenerator';
import { activateTip } from '@/lib/services/weeklyTipService';
import { useRouter } from 'next/navigation';

export default function AdminTipsPage() {
  const router = useRouter();
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTip, setSelectedTip] = useState<any | null>(null);
  const [generatingTip, setGeneratingTip] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<WeeklyTipCategory>(WeeklyTipCategory.CONVERSATION_STARTERS);
  const [openaiError, setOpenaiError] = useState<string | null>(null);

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    setLoading(true);
    try {
      const tipsQuery = query(collection(db, 'weeklyTips'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(tipsQuery);
      
      const tipsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTips(tipsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching tips:', err);
      setError('Failed to load tips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateTipStatus = async (tipId: string, newStatus: string) => {
    try {
      console.log(`Updating tip ${tipId} status to ${newStatus}`);
      
      // If activating a tip, use the dedicated activateTip function which handles deactivating any currently active tip
      if (newStatus === WeeklyTipStatus.ACTIVE) {
        console.log('Activating tip with ID:', tipId);
        
        // First verify the tip exists
        const tipRef = doc(db, 'weeklyTips', tipId);
        const tipSnap = await getDoc(tipRef);
        
        if (!tipSnap.exists()) {
          throw new Error(`Tip with ID ${tipId} does not exist`);
        }
        
        // Use the activateTip service function which handles deactivating other tips
        await activateTip(tipId);
        console.log('Tip activated successfully');
        
        // Force clear any cached tips in local storage to ensure dashboard shows the new tip
        localStorage.removeItem('activeTip');
        localStorage.removeItem('tipLastFetch');
      } else {
        // For other status changes, update directly
        const tipRef = doc(db, 'weeklyTips', tipId);
        await updateDoc(tipRef, { 
          status: newStatus,
          updatedAt: Timestamp.now()
        });
        console.log(`Tip ${tipId} status updated to ${newStatus}`);
      }
      
      // Refresh the tips list to get the latest data
      console.log('Refreshing tips list after status update');
      await fetchTips();
      
      // Update the selected tip if it's the one being modified
      if (selectedTip?.id === tipId) {
        const updatedTip = tips.find(tip => tip.id === tipId);
        if (updatedTip) {
          setSelectedTip(updatedTip);
          console.log('Selected tip updated:', updatedTip);
        }
      }
      
      // If the tip was activated, redirect to the dashboard to see it
      if (newStatus === WeeklyTipStatus.ACTIVE) {
        alert('Tip activated successfully! Redirecting to dashboard to see the tip.');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error updating tip status:', err);
      alert('Failed to update tip status: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const deleteTip = async (tipId: string) => {
    if (!confirm('Are you sure you want to delete this tip? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'weeklyTips', tipId));
      setTips(prevTips => prevTips.filter(tip => tip.id !== tipId));
      if (selectedTip?.id === tipId) {
        setSelectedTip(null);
      }
    } catch (err) {
      console.error('Error deleting tip:', err);
      alert('Failed to delete tip');
    }
  };
  
  const generateTip = async () => {
    setGeneratingTip(true);
    setOpenaiError(null);
    
    try {
      console.log('Attempting to generate tip with category:', selectedCategory);
      
      // Call our server-side API endpoint to generate the tip
      console.log('Calling server-side API to generate tip for category:', selectedCategory);
      
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: selectedCategory
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(`Failed to generate tip: ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      const generatedTip = data.tip;
      
      console.log('Generated tip data:', generatedTip);
      
      if (!generatedTip || !generatedTip.title) {
        throw new Error('Generated tip data is invalid or incomplete');
      }
      
      // Ensure all fields are properly formatted
      const tipToSave = {
        ...generatedTip,
        status: WeeklyTipStatus.PENDING,
        aiGenerated: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Convert Date objects to Firestore Timestamps if needed
        publishedAt: generatedTip.publishedAt ? Timestamp.fromDate(new Date(generatedTip.publishedAt)) : null
      };
      
      console.log('Saving tip to Firestore:', tipToSave);
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'weeklyTips'), tipToSave);
      console.log('Tip saved with ID:', docRef.id);
      
      // Add to local state with the Firestore ID
      const newTip = {
        id: docRef.id,
        ...tipToSave
      };
      
      setTips(prevTips => [newTip, ...prevTips]);
      setSelectedTip(newTip);
      
      // Show success message
      alert('Tip generated and saved to database successfully!');
      
      // Refresh the tips list to ensure we have the latest data
      await fetchTips();
    } catch (err: any) {
      console.error('Error generating tip:', err);
      setOpenaiError(err.message || 'Failed to generate tip');
    } finally {
      setGeneratingTip(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp instanceof Timestamp 
        ? timestamp.toDate() 
        : new Date(timestamp);
      
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (err) {
      return 'Invalid date';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Weekly Tips Management</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tips List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">All Tips</h2>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              {loading ? (
                <div className="p-4 text-center">Loading tips...</div>
              ) : tips.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No tips found</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {tips.map(tip => (
                    <li 
                      key={tip.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedTip?.id === tip.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedTip(tip)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900 truncate">{tip.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Created: {formatDate(tip.createdAt)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(tip.status)}`}>
                          {tip.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Generate with OpenAI</h3>
                
                {openaiError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                    {openaiError}
                  </div>
                )}
                
                <div className="mb-2">
                  <p className="text-sm text-gray-700 mb-2">
                    To use the OpenAI tip generator, make sure your API key is in the .env.local file.
                  </p>
                  <p className="text-xs text-gray-500">
                    The API key should be set as NEXT_PUBLIC_OPENAI_API_KEY in your .env.local file.
                    Get your API key from <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">platform.openai.com/account/api-keys</a>
                  </p>
                </div>
                
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tip Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as WeeklyTipCategory)}
                    className="w-full p-2 border rounded"
                    disabled={generatingTip}
                  >
                    {Object.values(WeeklyTipCategory).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={generateTip}
                  disabled={generatingTip}
                  className={`w-full py-2 px-4 rounded ${generatingTip ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                >
                  {generatingTip ? 'Generating...' : 'Generate New Tip with OpenAI'}
                </button>
                
                <p className="text-xs text-gray-500 mt-2">
                  Requires OpenAI API key in environment variables.
                </p>
              </div>
            </div>
          </div>
          
          {/* Tip Details */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            {selectedTip ? (
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">{selectedTip.title}</h2>
                  <div className="flex space-x-2">
                    {selectedTip.status !== 'active' && (
                      <button
                        onClick={() => updateTipStatus(selectedTip.id, 'active')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Activate
                      </button>
                    )}
                    {selectedTip.status !== 'archived' && (
                      <button
                        onClick={() => updateTipStatus(selectedTip.id, 'archived')}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Archive
                      </button>
                    )}
                    <button
                      onClick={() => deleteTip(selectedTip.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`inline-block px-2 py-1 text-sm rounded-full mt-1 ${getStatusBadgeClass(selectedTip.status)}`}>
                      {selectedTip.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{selectedTip.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(selectedTip.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Published</p>
                    <p className="font-medium">{formatDate(selectedTip.publishedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Views</p>
                    <p className="font-medium">{selectedTip.viewCount || 0} total / {selectedTip.uniqueViewCount || 0} unique</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">AI Generated</p>
                    <p className="font-medium">{selectedTip.aiGenerated ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Short Description</h3>
                  <p className="bg-gray-100 p-3 rounded text-gray-800">{selectedTip.shortDescription}</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Main Content</h3>
                  <div className="bg-gray-100 p-3 rounded whitespace-pre-line text-gray-800">
                    {selectedTip.mainContent || selectedTip.content}
                  </div>
                </div>
                
                {selectedTip.whyThisMatters && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Why This Matters</h3>
                    <div className="bg-gray-100 p-3 rounded whitespace-pre-line text-gray-800">
                      {selectedTip.whyThisMatters}
                    </div>
                  </div>
                )}
                
                {selectedTip.quickTips && selectedTip.quickTips.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Quick Tips</h3>
                    <ul className="bg-gray-100 p-3 rounded list-disc pl-5 text-gray-800">
                      {selectedTip.quickTips.map((tip: string, index: number) => (
                        <li key={index} className="mb-1">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedTip.didYouKnow && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Did You Know</h3>
                    <p className="bg-gray-100 p-3 rounded text-gray-800">{selectedTip.didYouKnow}</p>
                  </div>
                )}
                
                {selectedTip.weeklyChallenge && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Weekly Challenge</h3>
                    <p className="bg-gray-100 p-3 rounded text-gray-800">{selectedTip.weeklyChallenge}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-700">
                <p>Select a tip to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
