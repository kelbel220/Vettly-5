'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OrbField } from '../components/gradients/OrbField';
import Image from 'next/image';
import { inter, playfair } from '../fonts';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, UserCircle, Bell, CreditCard, Shield, HelpCircle, LogOut } from 'lucide-react';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';

interface PaymentCard {
  id: string;
  last4: string;
  cardType: string;
  expiryDate: string;
  isDefault: boolean;
}

interface UserData {
  firstName: string;
  lastName: string;
  profilePhotoUrl: string;
  email: string;
  membership?: {
    status: string;
    tier: string;
    startDate?: any;
    expiryDate?: any;
    matchesRemaining?: number;
    lastPaymentDate?: any;
  };
  billingCycle?: string;
  nextBillingDate?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  paymentMethods?: PaymentCard[];
}

export default function Settings() {
  const { currentUser, logout, resetPassword } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('account');
  // Removed notifications and privacy sections
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    sms: false
  });
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showManagePayments, setShowManagePayments] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [pauseDuration, setPauseDuration] = useState('1');
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data() as UserData;
            // Default payment card if none exists
            const defaultPaymentMethods = [
              {
                id: 'card-1',
                last4: '4242',
                cardType: 'Visa',
                expiryDate: '12/26',
                isDefault: true
              }
            ];
            
            // Calculate next billing date if membership exists
            let nextBillingDate = '2025-06-20';
            if (data.membership?.startDate) {
              const startDate = new Date(data.membership.startDate.seconds * 1000);
              const nextMonth = new Date(startDate);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              nextBillingDate = nextMonth.toISOString().split('T')[0];
            }
            
            setUserData({
              ...data,
              // Ensure membership data exists
              membership: data.membership || {
                status: 'inactive',
                tier: 'none',
                matchesRemaining: 0
              },
              billingCycle: data.billingCycle || 'monthly',
              nextBillingDate: data.nextBillingDate || nextBillingDate,
              notificationPreferences: data.notificationPreferences || {
                email: true,
                push: true,
                sms: false
              },
              paymentMethods: data.paymentMethods || defaultPaymentMethods
            });
            
            setPaymentCards(data.paymentMethods || defaultPaymentMethods);
            
            if (data.notificationPreferences) {
              setNotificationPrefs(data.notificationPreferences);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [currentUser]);

  const handleNotificationChange = async (type: 'email' | 'push' | 'sms') => {
    const newPrefs = {
      ...notificationPrefs,
      [type]: !notificationPrefs[type]
    };
    
    setNotificationPrefs(newPrefs);
    
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          notificationPreferences: newPrefs
        });
      } catch (error) {
        console.error('Error updating notification preferences:', error);
      }
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden">
        <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
          <div className="absolute inset-0 overflow-hidden">
            <OrbField />
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <div className="w-64 h-64 rounded-full bg-white/10 animate-pulse mb-8" />
          <div className="h-8 w-64 bg-white/10 animate-pulse mb-4 rounded" />
          <div className="h-4 w-48 bg-white/10 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col lg:flex-row">
      {/* Change Plan Modal */}
      {showChangePlan && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowChangePlan(false)}></div>
          <div className="relative bg-white p-px rounded-xl overflow-hidden shadow-2xl max-w-5xl w-full mx-4">
            <div className="relative bg-white rounded-xl p-0 overflow-y-auto max-h-[90vh]">
              {/* Header */}
              <div className="bg-purple-600 text-white py-3 px-6 text-center">
                <h3 className={`${playfair.className} text-xl`}>Your Monthly Plan</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Standard Plan */}
                <div 
                  onClick={() => setSelectedPlan('standard')}
                  className={`relative cursor-pointer transition-all duration-300 ${selectedPlan === 'standard' ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                >
                  <div className={`relative h-full flex flex-col border rounded-xl overflow-hidden ${selectedPlan === 'standard' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'} p-6`}>
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <h4 className={`${playfair.className} text-xl text-gray-800`}>Standard Matchmaker</h4>
                        {selectedPlan === 'standard' && (
                          <div className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                            Selected
                          </div>
                        )}
                      </div>
                      <p className={`${inter.className} text-sm text-gray-500 mt-1`}>For those wanting to explore matchmaking.</p>
                      <div className="mt-4">
                        <span className={`${inter.className} text-3xl font-light text-gray-800`}>$39</span>
                        <span className={`${inter.className} text-gray-500 ml-1`}>/mo</span>
                      </div>
                      <p className={`${inter.className} text-sm text-gray-500`}>Per month</p>
                    </div>
                    
                    <div className="flex-grow relative">
                      <ul className={`space-y-3 ${inter.className}`}>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">1 x personalised match provided monthly</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Completely hands off service, simply turn up to your date</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">No endless messaging, just face to face date</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">No public profiles</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Every match is vetted, including a virtual interview</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Dedicated matchmaker</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Every match is vetted, including a virtual interview</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Apply & join for free</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Cancel & pause anytime</span>
                        </li>
                      </ul>
                      
                      <div className="mt-5 pt-4 border-t border-gray-200">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent div's onClick
                            setSelectedPlan('standard');
                          }}
                          className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md mb-3"
                        >
                          Change plan
                        </button>
                        <p className={`text-xs text-gray-500 ${inter.className} text-center`}>
                          <span className="font-medium">Note:</span> The first month is $69, which includes your one-time screening interview.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Priority Plan */}
                <div 
                  onClick={() => setSelectedPlan('premium')}
                  className={`relative cursor-pointer transition-all duration-300 ${selectedPlan === 'premium' ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                >
                  <div className={`relative h-full flex flex-col border rounded-xl overflow-hidden ${selectedPlan === 'premium' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'} p-6`}>
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <h4 className={`${playfair.className} text-xl text-gray-800`}>Priority Matchmaker</h4>
                        {selectedPlan === 'premium' && (
                          <div className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                            Selected
                          </div>
                        )}
                      </div>
                      <p className={`${inter.className} text-sm text-gray-500 mt-1`}>For those serious about intentional dating.</p>
                      <div className="mt-4">
                        <span className={`${inter.className} text-3xl font-light text-gray-800`}>$49</span>
                        <span className={`${inter.className} text-gray-500 ml-1`}>/mo</span>
                      </div>
                      <p className={`${inter.className} text-sm text-gray-500`}>Per month</p>
                    </div>
                    
                    <div className="flex-grow relative">
                      <ul className={`space-y-3 ${inter.className}`}>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">2 x personalised matches provided monthly</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Completely hands off service, simply turn up to your date</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">No endless messaging, just face to face dates</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Priority access to matches before standard members</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">No public profiles</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Dedicated matchmaker</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Every match is vetted, including a virtual interview</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Apply & join for free</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Cancel & pause anytime</span>
                        </li>
                      </ul>
                      
                      <div className="mt-5 pt-4 border-t border-gray-200">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent div's onClick
                            setSelectedPlan('premium');
                          }}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md mb-3"
                        >
                          Change plan
                        </button>
                        <p className={`text-xs text-gray-500 ${inter.className} text-center`}>
                          <span className="font-medium">Note:</span> The first month is $79, which includes your one-time screening interview.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowChangePlan(false)}
                  className={`${inter.className} px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors`}
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    // Handle plan change logic here
                    if (selectedPlan && currentUser) {
                      try {
                        // Update plan in Firebase
                        const userRef = doc(db, 'users', currentUser.uid);
                        await updateDoc(userRef, {
                          'membership.tier': selectedPlan === 'standard' ? 'one_match' : 'two_matches',
                          'membership.status': 'active',
                          'membership.matchesRemaining': selectedPlan === 'standard' ? 1 : 2,
                          'membership.startDate': serverTimestamp(),
                          'membership.lastPaymentDate': serverTimestamp()
                        });
                        
                        // Update local state
                        setUserData(prevData => {
                          if (prevData) {
                            return {
                              ...prevData,
                              membership: {
                                ...prevData.membership,
                                tier: selectedPlan === 'standard' ? 'one_match' : 'two_matches',
                                status: 'active',
                                matchesRemaining: selectedPlan === 'standard' ? 1 : 2,
                                startDate: new Date(),
                                lastPaymentDate: new Date()
                              }
                            };
                          }
                          return prevData;
                        });
                        
                        // Close modal
                        setShowChangePlan(false);
                        
                        // Show success message (you could add a toast notification here)
                        console.log(`Plan changed to ${selectedPlan}`);
                      } catch (error) {
                        console.error('Error updating plan:', error);
                      }
                    }
                  }}
                  disabled={!selectedPlan}
                  className={`${inter.className} px-4 py-2 ${selectedPlan ? 'bg-[#6200EE] hover:bg-[#6200EE]/90' : 'bg-[#6200EE]/50 cursor-not-allowed'} text-white rounded-lg transition-colors`}
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Pause Membership Modal */}
      {showPauseConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPauseConfirm(false)}></div>
          <div className="relative bg-gradient-to-br from-[#2800A3]/90 to-[#34D8F1]/90 p-px rounded-2xl overflow-hidden shadow-2xl max-w-md w-full mx-4">
            <div className="relative bg-[#0F172A]/90 backdrop-blur-md rounded-2xl p-6 text-white">
              <h3 className={`${playfair.className} text-xl mb-4`}>Pause Your Membership</h3>
              <p className={`${inter.className} text-white/80 mb-6`}>Your membership will be paused and you won't be charged during this period. You can resume your membership at any time.</p>
              
              <div className="mb-4">
                <label className={`${inter.className} block text-white/80 mb-2`}>Pause Duration</label>
                <select 
                  value={pauseDuration}
                  onChange={(e) => setPauseDuration(e.target.value)}
                  className={`${inter.className} w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white appearance-none cursor-pointer`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  <option value="1">1 Month</option>
                  <option value="2">2 Months</option>
                  <option value="3">3 Months</option>
                  <option value="4">4 Months</option>
                  <option value="5">5 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">1 Year</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowPauseConfirm(false)}
                  className={`${inter.className} px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors`}
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    // Handle pause membership logic here
                    if (pauseDuration && currentUser) {
                      try {
                        // Calculate new billing date
                        const currentDate = new Date();
                        const newDate = new Date(currentDate);
                        
                        // Add pause duration to the current date
                        if (pauseDuration === '1week') {
                          newDate.setDate(currentDate.getDate() + 7);
                        } else if (pauseDuration === '2weeks') {
                          newDate.setDate(currentDate.getDate() + 14);
                        } else if (pauseDuration === '1month') {
                          newDate.setMonth(currentDate.getMonth() + 1);
                        } else if (pauseDuration === '3months') {
                          newDate.setMonth(currentDate.getMonth() + 3);
                        }
                        
                        // Format date for display
                        const formattedNewDate = newDate.toISOString().split('T')[0];
                        
                        // Update user data in Firebase
                        const userRef = doc(db, 'users', currentUser.uid);
                        await updateDoc(userRef, {
                          'membership.status': 'paused',
                          nextBillingDate: formattedNewDate
                        });
                        
                        // Update local state
                        setUserData(prevData => {
                          if (prevData) {
                            return {
                              ...prevData,
                              membership: {
                                ...prevData.membership,
                                status: 'paused'
                              },
                              nextBillingDate: formattedNewDate
                            };
                          }
                          return prevData;
                        });
                        
                        // Close modal
                        setShowPauseConfirm(false);
                        
                        // Show success message (you could add a toast notification here)
                        console.log(`Membership paused until ${formattedNewDate}`);
                      } catch (error) {
                        console.error('Error pausing membership:', error);
                      }
                    }
                  }}
                  className={`${inter.className} px-4 py-2 bg-[#3B00CC] text-white rounded-lg hover:bg-[#3B00CC]/90 transition-colors`}
                >
                  Confirm Pause
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Cancel Membership Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)}></div>
          <div className="relative bg-gradient-to-br from-[#2800A3]/90 to-[#34D8F1]/90 p-px rounded-2xl overflow-hidden shadow-2xl max-w-md w-full mx-4">
            <div className="relative bg-[#0F172A]/90 backdrop-blur-md rounded-2xl p-6 text-white">
              <h3 className={`${playfair.className} text-xl mb-4`}>Cancel Your Membership</h3>
              <p className={`${inter.className} text-white/80 mb-6`}>Your membership will be cancelled and you won't be charged during this period. You can resume your membership at any time.</p>
              
              <div className="p-4 bg-red-500/10 rounded-lg mb-4">
                <p className={`${inter.className} text-white/90`}>Your membership will remain active until the end of your current billing period on <span className="font-medium">{userData?.nextBillingDate}</span>.</p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowCancelConfirm(false)}
                  className={`${inter.className} px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors`}
                >
                  Keep Membership
                </button>
                <button 
                  onClick={async () => {
                    // Handle cancel membership logic here
                    if (currentUser) {
                      try {
                        // Update user data in Firebase
                        const userRef = doc(db, 'users', currentUser.uid);
                        await updateDoc(userRef, {
                          'membership.status': 'inactive'
                        });
                        
                        // Update local state
                        setUserData(prevData => {
                          if (prevData) {
                            return {
                              ...prevData,
                              membership: {
                                ...prevData.membership,
                                status: 'inactive'
                              }
                            };
                          }
                          return prevData;
                        });
                        
                        setShowCancelConfirm(false);
                      } catch (error) {
                        console.error('Error cancelling membership:', error);
                      }
                    }
                  }}
                  className={`${inter.className} px-4 py-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors`}
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Payment Method Modal */}
      {showAddPayment && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddPayment(false)}></div>
          <div className="relative bg-gradient-to-br from-[#2800A3] to-[#34D8F1] p-px rounded-xl overflow-hidden shadow-2xl max-w-md w-full mx-4">
            <div className="relative bg-[#1a1a2e] rounded-xl p-6 overflow-y-auto max-h-[90vh]">
              <button 
                onClick={() => setShowAddPayment(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h3 className={`${playfair.className} text-xl text-white mb-6`}>Add Payment Method</h3>
              
              <form className="space-y-4">
                <div>
                  <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Card Number</label>
                  <input 
                    type="text" 
                    placeholder="1234 5678 9012 3456"
                    className={`${inter.className} w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Expiry Date</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY"
                      className={`${inter.className} w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white`}
                    />
                  </div>
                  <div>
                    <label className={`${inter.className} block text-white/70 text-sm mb-1`}>CVC</label>
                    <input 
                      type="text" 
                      placeholder="123"
                      className={`${inter.className} w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`${inter.className} block text-white/70 text-sm mb-1`}>Name on Card</label>
                  <input 
                    type="text" 
                    placeholder="John Smith"
                    className={`${inter.className} w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white`}
                  />
                </div>
                
                <div className="flex items-center mt-2">
                  <input 
                    type="checkbox" 
                    id="makeDefault" 
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-[#3B00CC]" 
                  />
                  <label htmlFor="makeDefault" className={`${inter.className} ml-2 block text-sm text-white/70`}>
                    Make this my default payment method
                  </label>
                </div>
                
                <div className="pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      // Simulate adding a new card
                      const newCard = {
                        id: `card-${paymentCards.length + 1}`,
                        last4: '1234',
                        cardType: 'Mastercard',
                        expiryDate: '09/27',
                        isDefault: false
                      };
                      
                      const updatedCards = [...paymentCards, newCard];
                      setPaymentCards(updatedCards);
                      
                      // Update user data
                      if (userData) {
                        setUserData({
                          ...userData,
                          paymentMethods: updatedCards
                        });
                      }
                      
                      setShowAddPayment(false);
                    }}
                    className={`${inter.className} w-full py-2 px-4 bg-[#3B00CC] text-white rounded-lg hover:bg-[#3B00CC]/90 transition-colors`}
                  >
                    Add Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Manage Payment Methods Modal */}
      {showManagePayments && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowManagePayments(false)}></div>
          <div className="relative bg-gradient-to-br from-[#2800A3] to-[#34D8F1] p-px rounded-xl overflow-hidden shadow-2xl max-w-md w-full mx-4">
            <div className="relative bg-[#1a1a2e] rounded-xl p-6 overflow-y-auto max-h-[90vh]">
              <button 
                onClick={() => setShowManagePayments(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h3 className={`${playfair.className} text-xl text-white mb-6`}>Manage Payment Methods</h3>
              
              <div className="space-y-4">
                {/* Default Card */}
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-md p-2">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`${inter.className} text-white font-medium`}>•••• •••• •••• 4242</p>
                        <p className={`${inter.className} text-white/60 text-sm`}>Visa · Expires 12/26</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${inter.className} text-xs px-2 py-1 bg-[#3B00CC]/20 text-[#3B00CC]/90 rounded-full`}>Default</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button className={`${inter.className} text-sm text-white/70 hover:text-white`}>Edit</button>
                    <button 
                      className={`${inter.className} text-sm ${paymentCards.length > 1 ? 'text-red-400 hover:text-red-300' : 'text-gray-500 cursor-not-allowed'}`}
                      onClick={() => {
                        if (paymentCards.length > 1) {
                          // Show confirmation dialog or directly remove
                          alert('Card would be removed in a real implementation');
                        } else {
                          alert('Cannot remove the only payment method. Please add another card first.');
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button 
                    onClick={() => {
                      setShowManagePayments(false);
                      setShowAddPayment(true);
                    }}
                    className={`${inter.className} flex items-center justify-center gap-2 w-full py-2 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors`}
                  >
                    <span>Add New Payment Method</span>
                    <span className="text-lg">+</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
            if (!resetPasswordSuccess) {
              setShowResetPasswordModal(false);
              setResetPasswordError('');
            }
          }}></div>
          <div className="relative bg-gradient-to-br from-[#2800A3]/90 to-[#34D8F1]/90 p-px rounded-2xl overflow-hidden shadow-2xl max-w-md w-full mx-4">
            <div className="relative bg-white rounded-2xl p-6 overflow-hidden">
              <h3 className={`${playfair.className} text-xl text-gray-800 mb-4`}>
                {resetPasswordSuccess ? 'Password Reset Email Sent' : 'Reset Password'}
              </h3>
              
              {resetPasswordSuccess ? (
                <>
                  <p className={`${inter.className} text-gray-600 mb-6`}>
                    We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
                  </p>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => {
                        setShowResetPasswordModal(false);
                        setResetPasswordSuccess(false);
                      }}
                      className={`${inter.className} px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors`}
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className={`${inter.className} text-gray-600 mb-6`}>
                    We'll send a password reset link to the email address associated with your account: {userData?.email}
                  </p>
                  
                  {resetPasswordError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      {resetPasswordError}
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-4">
                    <button 
                      onClick={() => {
                        setShowResetPasswordModal(false);
                        setResetPasswordError('');
                      }}
                      className={`${inter.className} px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors`}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={async () => {
                        if (userData?.email) {
                          try {
                            await resetPassword(userData.email);
                            setResetPasswordSuccess(true);
                            setResetPasswordError('');
                          } catch (error: any) {
                            setResetPasswordError(error.message);
                          }
                        }
                      }}
                      className={`${inter.className} px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors`}
                    >
                      Send Reset Link
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Background */}
      <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
        <div className="absolute inset-0 overflow-hidden">
          <OrbField />
        </div>
      </div>
      
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col pb-[80px] lg:pb-0 pt-8">
        {/* Content Container */}
        <div className="relative h-full z-10">
          <div className="h-full overflow-y-auto px-4 py-8 pt-8">
            {/* Logo and Back Button */}
            <div className="flex flex-col items-center w-full mb-12">
              <div className="w-full flex justify-center mb-6">
                <Image
                  src="/vettly-logo.png"
                  alt="Vettly Logo"
                  width={120}
                  height={30}
                  className=""
                  priority
                />
              </div>
              <div className="absolute left-4 top-8">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className={inter.className}>Back to Dashboard</span>
                </button>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <h1 className={`${playfair.className} text-4xl font-normal tracking-tight mb-8 text-white text-center`}>Settings</h1>
              
              {/* Settings Navigation */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-8">
                <div className="flex flex-wrap justify-center items-center gap-4 mx-auto max-w-md">
                  <button
                    onClick={() => setActiveSection('account')}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
                      activeSection === 'account' 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <UserCircle className="w-5 h-5" />
                    <span className={inter.className}>Account</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveSection('help')}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
                      activeSection === 'help' 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span className={inter.className}>Help</span>
                  </button>
                </div>
              </div>
              
              {/* Settings Content */}
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6">
                {activeSection === 'account' && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-white/5 rounded-xl">
                        <UserCircle className="w-5 h-5 text-[#3B00CC]/70" />
                      </div>
                      <h3 className={`${playfair.className} text-xl text-white`}>Account Settings</h3>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Profile Information */}
                      <div className="p-4 bg-white/5 rounded-xl">
                        <h4 className={`${playfair.className} text-white text-lg mb-4`}>Profile Information</h4>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`${inter.className} text-white/70 text-sm`}>Name</p>
                              <p className={`${inter.className} text-white font-medium`}>{userData?.firstName} {userData?.lastName}</p>
                            </div>
                            <button className="text-[#3B00CC] hover:text-[#3B00CC]/80">
                              Edit
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`${inter.className} text-white/70 text-sm`}>Email</p>
                              <p className={`${inter.className} text-white font-medium`}>{userData?.email}</p>
                            </div>
                            <button className="text-[#3B00CC] hover:text-[#3B00CC]/80">
                              Edit
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`${inter.className} text-white/70 text-sm`}>Password</p>
                              <p className={`${inter.className} text-white font-medium`}>••••••••</p>
                            </div>
                            <button 
                              onClick={() => setShowResetPasswordModal(true)}
                              className="text-[#3B00CC] hover:text-[#3B00CC]/80"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Membership */}
                      <div className="p-4 bg-white/5 rounded-xl">
                        <h4 className={`${playfair.className} text-white text-lg mb-4`}>Membership</h4>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`${inter.className} text-white/70 text-sm`}>Current Plan</p>
                              <p className={`${inter.className} text-white font-medium`}>
                                {userData?.membership?.tier === 'two_matches' ? 'Priority Matchmaker' : 
                                 userData?.membership?.tier === 'one_match' ? 'Standard Matchmaker' : 'Free'}
                              </p>
                              {userData?.membership?.matchesRemaining !== undefined && (
                                <p className={`${inter.className} text-white/50 text-xs mt-1`}>
                                  {userData.membership.matchesRemaining} match{userData.membership.matchesRemaining !== 1 ? 'es' : ''} remaining this month
                                </p>
                              )}
                            </div>
                            <button 
                              onClick={() => setShowChangePlan(true)}
                              className="text-[#3B00CC] hover:text-[#3B00CC]/80"
                            >
                              Change
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`${inter.className} text-white/70 text-sm`}>Status</p>
                              <p className={`${inter.className} text-white font-medium capitalize`}>
                                {userData?.membership?.status || 'Inactive'}
                              </p>
                            </div>
                            {userData?.membership?.status === 'active' && (
                              <button 
                                onClick={() => setShowPauseConfirm(true)}
                                className="text-[#3B00CC] hover:text-[#3B00CC]/80"
                              >
                                Pause
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`${inter.className} text-white/70 text-sm`}>Billing Cycle</p>
                              <p className={`${inter.className} text-white font-medium`}>
                                {userData?.billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`${inter.className} text-white/70 text-sm`}>Next Billing Date</p>
                              <p className={`${inter.className} text-white font-medium`}>{userData?.nextBillingDate}</p>
                            </div>
                          </div>
                          
                          {userData?.membership?.status === 'active' && (
                            <button 
                              onClick={() => setShowCancelConfirm(true)}
                              className="w-full py-2 bg-white/10 text-white rounded-lg hover:bg-red-500/20 transition-colors mt-4"
                            >
                              Cancel Membership
                            </button>
                          )}
                      </div>
                      
                      {/* Payment Information */}
                      <div className="p-4 bg-white/5 rounded-xl">
                        <h4 className={`${playfair.className} text-white text-lg mb-4`}>Payment Information</h4>
                        
                        {/* Payment Cards */}
                        {paymentCards.length > 0 ? (
                          <div className="bg-white/10 rounded-lg p-3 mb-4">
                            {paymentCards.filter(card => card.isDefault).map((card) => (
                              <div key={card.id} className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-md p-2">
                                    <CreditCard className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className={`${inter.className} text-white font-medium`}>•••• •••• •••• {card.last4}</p>
                                    <p className={`${inter.className} text-white/60 text-sm`}>{card.cardType} · Expires {card.expiryDate}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`${inter.className} text-xs px-2 py-1 bg-[#3B00CC]/20 text-[#3B00CC]/90 rounded-full`}>Default</span>
                                </div>
                              </div>
                            ))}
                            {paymentCards.length > 1 && (
                              <p className={`${inter.className} text-white/60 text-sm mt-1`}>{paymentCards.length - 1} additional {paymentCards.length - 1 === 1 ? 'card' : 'cards'} on file</p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-white/10 rounded-lg p-3 mb-4 text-center">
                            <p className={`${inter.className} text-white/70`}>No payment methods found</p>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <button 
                            onClick={() => setShowAddPayment(true)}
                            className={`${inter.className} flex items-center gap-2 px-4 py-2 bg-[#3B00CC] text-white rounded-lg hover:bg-[#3B00CC]/90 transition-colors`}
                          >
                            <span>Add Payment Method</span>
                            <span className="text-lg">+</span>
                          </button>
                          
                          <button 
                            onClick={() => setShowManagePayments(true)}
                            className={`${inter.className} px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors`}
                          >
                            Manage Payment Methods
                          </button>
                        </div>
                      </div>
                      
                      {/* Password Reset */}
                      <div className="p-4 bg-white/5 rounded-xl">
                        <h4 className={`${playfair.className} text-white text-lg mb-4`}>Password</h4>
                        <p className={`${inter.className} text-white/70 mb-4`}>You can reset your password at any time.</p>
                        <button 
                          onClick={() => setShowResetPasswordModal(true)}
                          className={`${inter.className} px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors`}
                        >
                          Reset Password
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'notifications' && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-white/5 rounded-xl">
                        <Bell className="w-5 h-5 text-[#3B00CC]/70" />
                      </div>
                      <h3 className={`${playfair.className} text-xl text-white`}>Notification Settings</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className={`${playfair.className} text-white text-lg`}>Email Notifications</h4>
                            <p className={`${inter.className} text-white/70 text-sm`}>Receive updates and alerts via email</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={notificationPrefs.email}
                              onChange={() => handleNotificationChange('email')}
                            />
                            <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B00CC]"></div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className={`${playfair.className} text-white text-lg`}>Push Notifications</h4>
                            <p className={`${inter.className} text-white/70 text-sm`}>Receive notifications in your browser</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={notificationPrefs.push}
                              onChange={() => handleNotificationChange('push')}
                            />
                            <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B00CC]"></div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className={`${playfair.className} text-white text-lg`}>SMS Notifications</h4>
                            <p className={`${inter.className} text-white/70 text-sm`}>Receive text messages for important updates</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={notificationPrefs.sms}
                              onChange={() => handleNotificationChange('sms')}
                            />
                            <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B00CC]"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'privacy' && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-white/5 rounded-xl">
                        <Shield className="w-5 h-5 text-[#3B00CC]/70" />
                      </div>
                      <h3 className={`${playfair.className} text-xl text-white`}>Privacy Settings</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="p-4 bg-white/5 rounded-xl">
                        <h4 className={`${playfair.className} text-white text-lg mb-4`}>Profile Visibility</h4>
                        <p className={`${inter.className} text-white/70 mb-4`}>Control who can see your profile information.</p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`${inter.className} text-white`}>Show my profile to other users</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B00CC]"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className={`${inter.className} text-white`}>Allow matching algorithm to use my data</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B00CC]"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-xl">
                        <h4 className={`${playfair.className} text-white text-lg mb-4`}>Data Management</h4>
                        <p className={`${inter.className} text-white/70 mb-4`}>Manage your personal data.</p>
                        
                        <div className="space-y-4">
                          <button className={`${inter.className} w-full py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors`}>
                            Download My Data
                          </button>
                          
                          <button className={`${inter.className} w-full py-2 bg-white/10 text-white rounded-lg hover:bg-red-500/20 transition-colors`}>
                            Delete My Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'help' && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-white/5 rounded-xl">
                        <HelpCircle className="w-5 h-5 text-[#3B00CC]/70" />
                      </div>
                      <h3 className={`${playfair.className} text-xl text-white`}>Help & Support</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="p-4 bg-white/5 rounded-xl">
                        <h4 className={`${playfair.className} text-white text-lg mb-4`}>Frequently Asked Questions</h4>
                        
                        <div className="space-y-4">
                          <div className="p-3 bg-white/5 rounded-lg">
                            <h5 className={`${playfair.className} text-white font-medium mb-2`}>How does the matching algorithm work?</h5>
                            <p className={`${inter.className} text-white/70 text-sm`}>Our AI-powered matching algorithm analyzes your preferences, interests, and compatibility factors to find the most suitable matches for you.</p>
                          </div>
                          
                          <div className="p-3 bg-white/5 rounded-lg">
                            <h5 className={`${playfair.className} text-white font-medium mb-2`}>Can I change my subscription plan?</h5>
                            <p className={`${inter.className} text-white/70 text-sm`}>Yes, you can upgrade or downgrade your subscription plan at any time from the Account settings section.</p>
                          </div>
                          
                          <div className="p-3 bg-white/5 rounded-lg">
                            <h5 className={`${playfair.className} text-white font-medium mb-2`}>How do I update my profile information?</h5>
                            <p className={`${inter.className} text-white/70 text-sm`}>You can update your profile information by clicking on the "Edit Profile" button in the Account settings section.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-xl">
                        <h4 className={`${playfair.className} text-white text-lg mb-4`}>Contact Support</h4>
                        <p className={`${inter.className} text-white/70 mb-4`}>Need help with something not covered in the FAQs? Contact our support team.</p>
                        
                        <button className={`${inter.className} w-full py-2 bg-[#3B00CC] text-white rounded-lg hover:bg-[#3B00CC]/90 transition-colors`}>
                          Contact Support
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sign Out Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className={inter.className}>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Mobile Navigation Bar */}
      <MobileNavigation activeTab={activeTab} />
    </div>
  );
}

