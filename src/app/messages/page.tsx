'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, orderBy, getDocs, addDoc, onSnapshot, doc, getDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import Image from 'next/image';
import { ArrowLeft, Send, User, Menu, Phone, Video, MoreVertical, Paperclip, Mic, Home, UserCircle } from 'lucide-react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl?: string;
  lastMessage?: string;
  lastMessageTime?: Timestamp;
  unreadCount: number;
}

export default function Messages() {
  const router = useRouter();
  const { currentUser } = useAuth();
  
  // Initialize with empty arrays instead of dummy data
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConversation, setShowConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is logged in, otherwise redirect to login
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    // In a real app, we would fetch contacts here from Firebase
  }, [currentUser, router]);

  // Load messages when a contact is selected
  useEffect(() => {
    if (!selectedContact) return;
    
    // In a real app, we would fetch messages for the selected contact here from Firebase
    setMessages([]);
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [currentUser, selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = () => {
    if (!currentUser || !selectedContact || !newMessage.trim()) return;

    // Create a new message object
    const newMsg: Message = {
      id: `new-${Date.now()}`,
      senderId: currentUser.uid,
      receiverId: selectedContact.id,
      content: newMessage.trim(),
      timestamp: Timestamp.fromDate(new Date()),
      read: false
    };

    // Add the new message to the messages array
    setMessages(prevMessages => [...prevMessages, newMsg]);
    setNewMessage('');
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle key press for sending message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle selecting a contact (different for mobile vs desktop)
  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    
    // Update the contact to mark messages as read
    setContacts(prevContacts => 
      prevContacts.map(c => 
        c.id === contact.id ? { ...c, unreadCount: 0 } : c
      )
    );
    
    if (window.innerWidth < 768) {
      setShowConversation(true);
    }
  };

  // Function to go back to contact list on mobile
  const handleBackToContacts = () => {
    setShowConversation(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B00CC] to-[#5A17E0] p-0 relative">
      <div className="h-full w-full mx-auto overflow-hidden pb-16 md:pb-0"> {/* Added padding bottom for mobile nav */}
        {/* Mobile Header - Only visible on mobile */}
        {selectedContact && showConversation ? (
          <div className="flex items-center justify-between p-3 bg-[#5A17E0] md:hidden">
            <div className="flex items-center">
              <button 
                onClick={handleBackToContacts}
                className="mr-3 text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              {selectedContact.profilePhotoUrl ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                  <Image 
                    src={selectedContact.profilePhotoUrl} 
                    alt={`${selectedContact.firstName} ${selectedContact.lastName}`}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
              <div className="ml-3">
                <h3 className="font-medium text-white" style={{fontFamily: inter.style.fontFamily}}>
                  {selectedContact.firstName} {selectedContact.lastName}
                </h3>
                <p className="text-xs text-white/70">Online now</p>
              </div>
            </div>
            <button className="text-white">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-[#5A17E0] md:hidden">
            <button className="text-white" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h2 className="text-[2.5rem] font-black tracking-wider uppercase text-white text-center">Message</h2>
            <button className="text-white">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        )}
        
        <div className="flex h-screen">
          {/* Contacts List */}
          <div className={`${showConversation ? 'hidden' : 'flex-1'} md:flex md:w-1/4 flex-col bg-gradient-to-b from-[#4A10D0] to-[#5A17E0] border-r border-white/10`}>
            <div className="p-4 border-b border-white/10 flex items-center">
              <button className="text-white hidden md:block mr-3" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h2 className="text-xl font-bold text-white hidden md:block" style={{fontFamily: inter.style.fontFamily}}>Message</h2>
            </div>
            
            {/* Search bar */}
            <div className="p-3">
              <div className="flex items-center bg-white/10 rounded-full p-2 px-4">
                <svg className="w-4 h-4 text-white/60 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search messages" 
                  className="bg-transparent w-full focus:outline-none text-sm text-white placeholder-white/60"
                  style={{fontFamily: inter.style.fontFamily}}
                />
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#34D8F1]"></div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 -mt-16 md:-mt-8">
                <div className="w-24 h-24 md:w-20 md:h-20 rounded-full bg-indigo-800/30 flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 md:w-10 md:h-10" fill="none" stroke="#34D8F1" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="text-3xl md:text-2xl font-bold text-white mb-4 md:mb-3" style={{fontFamily: inter.style.fontFamily}}>No Conversations</h3>
                <p className="text-white text-lg md:text-base text-center max-w-xs px-6" style={{fontFamily: inter.style.fontFamily}}>
                  You will get access to messages with your match 48 hours before your date.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {contacts.map(contact => (
                  <div 
                    key={contact.id}
                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-indigo-900/30 transition-colors ${selectedContact?.id === contact.id ? 'bg-indigo-900/40' : ''}`}
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowConversation(true);
                    }}
                  >
                    {/* Profile Photo */}
                    <div className="relative">
                      {contact.profilePhotoUrl ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-800">
                          <Image 
                            src={contact.profilePhotoUrl} 
                            alt={`${contact.firstName} ${contact.lastName}`}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-800 flex items-center justify-center">
                          <span className="text-white text-lg">{contact.firstName[0]}</span>
                        </div>
                      )}
                      {contact.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#34D8F1] flex items-center justify-center">
                          <span className="text-xs text-indigo-900 font-bold">{contact.unreadCount}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="text-white font-medium truncate">{contact.firstName} {contact.lastName}</h3>
                        {contact.lastMessageTime && (
                          <span className="text-xs text-indigo-300">
                            {new Date(contact.lastMessageTime.toMillis()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      {contact.lastMessage && (
                        <p className="text-sm text-indigo-300 truncate">{contact.lastMessage}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Messages Area */}
          <div className={`${!showConversation ? 'hidden' : 'flex-1'} md:flex md:w-3/4 flex-col bg-white`}>
            {selectedContact ? (
              <>
                {/* Contact Header - Desktop */}
                <div className="hidden md:flex p-4 border-b border-gray-200 items-center justify-between bg-white">
                  <div className="flex items-center">
                    {selectedContact.profilePhotoUrl ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <Image 
                          src={selectedContact.profilePhotoUrl} 
                          alt={`${selectedContact.firstName} ${selectedContact.lastName}`}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#5A17E0] flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                    
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-800" style={{fontFamily: inter.style.fontFamily}}>
                        {selectedContact.firstName} {selectedContact.lastName}
                      </h3>
                      <p className="text-xs text-gray-500">Online now</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex flex-col items-center justify-center h-full py-10 -mt-16 md:-mt-8">
                    <div className="w-24 h-24 md:w-20 md:h-20 rounded-full bg-indigo-800/30 flex items-center justify-center mb-6">
                      <svg className="w-12 h-12 md:w-10 md:h-10" fill="none" stroke="#34D8F1" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <h3 className="text-3xl md:text-2xl font-bold text-white mb-4 md:mb-3" style={{fontFamily: inter.style.fontFamily}}>No Messages</h3>
                    <p className="text-white text-lg md:text-base text-center max-w-xs px-6" style={{fontFamily: inter.style.fontFamily}}>
                      You will get access to messages with your match 48 hours before your date.
                    </p>
                  </div>
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Message Input */}
                <div className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex items-center">
                    <div className="flex-1 flex items-center bg-gray-100 rounded-full p-1 pl-4 pr-1 mr-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent resize-none focus:outline-none text-gray-800"
                        style={{fontFamily: inter.style.fontFamily}}
                      />
                      <button className="text-gray-500 p-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button className="text-gray-500 p-2">
                        <Paperclip className="h-5 w-5" />
                      </button>
                    </div>
                    <button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className={`p-3 rounded-md ${newMessage.trim() ? 'bg-[#5A17E0] text-white' : 'bg-gray-200 text-gray-400'}`}>
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Select a conversation</h3>
                <p className="text-gray-500 max-w-md">
                  Choose a contact from the list to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#5A17E0] h-16 flex items-center justify-around md:hidden border-t border-white/10">
        <button 
          className="flex flex-col items-center justify-center text-white w-1/2"
          onClick={() => router.push('/dashboard')}
        >
          <Home className="h-6 w-6 mb-1" />
          <span className="text-xs">Home</span>
        </button>
        <button 
          className="flex flex-col items-center justify-center text-white w-1/2"
          onClick={() => router.push('/profile')}
        >
          <UserCircle className="h-6 w-6 mb-1" />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  );
}
