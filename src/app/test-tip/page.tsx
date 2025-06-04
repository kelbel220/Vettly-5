'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp, doc, setDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';

export default function TestTipPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [tipId, setTipId] = useState<string>('');
  const [existingTips, setExistingTips] = useState<any[]>([]);
  const [showExistingTips, setShowExistingTips] = useState<boolean>(false);

  // Check for existing tips on component mount
  useEffect(() => {
    const checkExistingTips = async () => {
      try {
        const tipsQuery = query(
          collection(db, 'weeklyTips'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const snapshot = await getDocs(tipsQuery);
        
        if (!snapshot.empty) {
          const tips = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setExistingTips(tips);
        }
      } catch (error) {
        console.error('Error checking existing tips:', error);
      }
    };
    
    checkExistingTips();
  }, []);

  const createTestTip = async () => {
    setLoading(true);
    setStatus('Creating test tip...');
    
    try {      
      const now = Timestamp.now();
      const oneWeekFromNow = Timestamp.fromDate(
        new Date(now.toDate().getTime() + 7 * 24 * 60 * 60 * 1000)
      );
      
      // Create a test tip with a fixed ID to make it easier to find/update
      const fixedTipId = 'test-tip-' + new Date().getTime();
      
      const testTip = {
        title: "Perfect Your Profile",
        content: "Adding high-quality photos and completing all sections of your profile significantly increases your chances of making meaningful connections. Take time to showcase your personality and interests.",
        shortDescription: "Profiles with detailed information and clear photos receive 40% more matches!",
        category: "profile_improvement",
        status: "active", // Set to active so it shows up immediately
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
        expiresAt: oneWeekFromNow,
        aiGenerated: false,
        quickTips: [
          "Use recent photos that clearly show your face",
          "Include at least one full-body photo",
          "Add photos of you doing activities you enjoy",
          "Be specific about your interests rather than generic statements",
          "Have a friend review your profile for feedback"
        ],
        didYouKnow: "Users who complete all profile sections are 70% more likely to receive messages and match requests compared to those with minimal information.",
        weeklyChallenge: "Review your profile and add at least three new details about yourself that you haven't shared before. This gives potential matches more conversation starters!",
        viewCount: 0,
        uniqueViewCount: 0
      };

      try {
        // Try to use addDoc first (doesn't require specific permissions)
        const docRef = await addDoc(collection(db, 'weeklyTips'), testTip);
        setTipId(docRef.id);
        setStatus(`Success! Test tip created with ID: ${docRef.id}`);
        
        // Refresh the existing tips list
        setExistingTips(prev => [{
          id: docRef.id,
          ...testTip
        }, ...prev]);
      } catch (addError) {
        console.error('Error with addDoc, trying setDoc:', addError);
        
        // Fallback to setDoc if addDoc fails
        await setDoc(doc(db, 'weeklyTips', fixedTipId), testTip);
        setTipId(fixedTipId);
        setStatus(`Success! Test tip created with ID: ${fixedTipId}`);
        
        // Refresh the existing tips list
        setExistingTips(prev => [{
          id: fixedTipId,
          ...testTip
        }, ...prev]);
      }
    } catch (error) {
      console.error('Error creating test tip:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h1 className="text-2xl font-bold mb-4">Weekly Tip Test Tool</h1>
        <p className="mb-4 text-gray-600">
          This page creates a test weekly tip in Firestore to help test the weekly tip feature.
        </p>
        
        {existingTips.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Found {existingTips.length} active tip{existingTips.length !== 1 ? 's' : ''}</span>
              <button 
                onClick={() => setShowExistingTips(!showExistingTips)}
                className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded"
              >
                {showExistingTips ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showExistingTips && (
              <ul className="list-disc pl-5 text-sm">
                {existingTips.map(tip => (
                  <li key={tip.id} className="mb-1">
                    <strong>{tip.title}</strong> (ID: {tip.id.substring(0, 8)}...)
                  </li>
                ))}
              </ul>
            )}
            
            <p className="text-xs mt-2">
              You already have active tips. You can still create another one if needed.
            </p>
          </div>
        )}
        
        <button
          onClick={createTestTip}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Creating...' : 'Create Test Tip'}
        </button>
        
        {status && (
          <div className={`mt-4 p-3 rounded ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {status}
          </div>
        )}
        
        {tipId && (
          <div className="mt-4">
            <h2 className="font-semibold">Next Steps:</h2>
            <ol className="list-decimal pl-5 mt-2">
              <li>Go to the <a href="/dashboard" className="text-blue-600 hover:underline">dashboard</a> to see your new weekly tip</li>
              <li>The tip should appear in the Tips & Advice section</li>
              <li>Click "Read Full Tip" to see the complete tip content</li>
            </ol>
          </div>
        )}
        
        {/* Troubleshooting section */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-2">Troubleshooting</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li className="mb-1">If you see a <strong>"Missing or insufficient permissions"</strong> error, try refreshing the page and trying again</li>
            <li className="mb-1">Make sure you're logged in to see the weekly tip on the dashboard</li>
            <li className="mb-1">If tips don't appear on the dashboard after creation, try refreshing the page</li>
          </ul>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-2">Admin Tools</h3>
          <p className="text-sm text-gray-600 mb-3">
            Use the admin interface to manage all weekly tips:
          </p>
          <a 
            href="/admin/tips" 
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Open Admin Interface
          </a>
        </div>
      </div>
    </div>
  );
}
