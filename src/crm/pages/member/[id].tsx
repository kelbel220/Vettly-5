'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import MemberProfileMatchApproval from '@/crm/components/MemberProfileMatchApproval';
import { useAuth } from '@/context/AuthContext';

interface MemberData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImageUrl?: string;
  membershipStatus: string;
  // Add other member fields as needed
}

const MemberProfilePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser } = useAuth();
  
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchMemberData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const memberRef = doc(db, 'users', id as string);
        const memberDoc = await getDoc(memberRef);

        if (!memberDoc.exists()) {
          setError('Member not found');
          setLoading(false);
          return;
        }

        const memberData = memberDoc.data();
        setMember({
          id: memberDoc.id,
          firstName: memberData.firstName || '',
          lastName: memberData.lastName || '',
          email: memberData.email || '',
          phone: memberData.phone || '',
          profileImageUrl: memberData.profileImageUrl || '',
          membershipStatus: memberData.membershipStatus || 'inactive',
          // Add other member fields as needed
        });
      } catch (err) {
        console.error('Error fetching member data:', err);
        setError('Failed to load member data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMemberData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Member not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Member Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center">
          {member.profileImageUrl ? (
            <img
              src={member.profileImageUrl}
              alt={`${member.firstName} ${member.lastName}`}
              className="h-24 w-24 rounded-full object-cover mr-6"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mr-6">
              <span className="text-2xl text-gray-500">
                {member.firstName.charAt(0)}
                {member.lastName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {member.firstName} {member.lastName}
            </h1>
            <p className="text-gray-600">{member.email}</p>
            <p className="text-gray-600">{member.phone}</p>
            <div className="mt-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                member.membershipStatus === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {member.membershipStatus.charAt(0).toUpperCase() + member.membershipStatus.slice(1)} Member
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'matches'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Matches
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'approvals'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Approvals
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Member Profile</h2>
            {/* Profile content goes here */}
            <p className="text-gray-600">Member profile details would be displayed here.</p>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Member Matches</h2>
            {/* Matches content goes here */}
            <p className="text-gray-600">Member match history would be displayed here.</p>
          </div>
        )}

        {activeTab === 'approvals' && (
          <MemberProfileMatchApproval 
            memberId={member.id} 
            matchmakerId={currentUser?.uid || ''}
          />
        )}
      </div>
    </div>
  );
};

export default MemberProfilePage;
