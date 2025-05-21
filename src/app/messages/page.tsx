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
  
  // Sample dummy data for demonstration
  const dummyContacts: Contact[] = [
    {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      profilePhotoUrl: '/images/profile1.jpg',
      lastMessage: 'Looking forward to meeting you!',
      lastMessageTime: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 30)),
      unreadCount: 2
    },
    {
      id: '2',
      firstName: 'Michael',
      lastName: 'Chen',
      profilePhotoUrl: '/images/profile2.jpg',
      lastMessage: 'What time works for you?',
      lastMessageTime: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 120)),
      unreadCount: 0
    },
    {
      id: '3',
      firstName: 'Emma',
      lastName: 'Wilson',
      lastMessage: 'Thanks for your help!',
      lastMessageTime: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 5)),
      unreadCount: 1
    }
  ];

  const dummyMessages: Message[] = [
    {
      id: '1',
      senderId: '1',
      receiverId: currentUser?.uid || '',
      content: 'Hi there! I saw your profile and I think you would be a great fit for our family.',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60)),
      read: true
    },
    {
      id: '2',
      senderId: currentUser?.uid || '',
      receiverId: '1',
      content: 'Thanks for reaching out! I would love to learn more about what you are looking for.',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 55)),
      read: true
    },
    {
      id: '3',
      senderId: '1',
      receiverId: currentUser?.uid || '',
      content: 'We need someone who can help with our two children, ages 5 and 8, primarily after school hours.',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 50)),
      read: true
    },
    {
      id: '4',
      senderId: currentUser?.uid || '',
      receiverId: '1',
      content: 'That sounds perfect for my schedule. I have experience with children in that age range.',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 45)),
      read: true
    },
    {
      id: '5',
      senderId: '1',
      receiverId: currentUser?.uid || '',
      content: 'Great! Would you be available for an interview this week?',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 40)),
      read: true
    },
    {
      id: '6',
      senderId: '1',
      receiverId: currentUser?.uid || '',
      content: 'We could meet on Thursday afternoon if that works for you.',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 35)),
      read: false
    },
    {
      id: '7',
      senderId: '1',
      receiverId: currentUser?.uid || '',
      content: 'Please let me know what time would be best.',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 30)),
      read: false
    }
  ];

  const [contacts, setContacts] = useState<Contact[]>(dummyContacts);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConversation, setShowConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For demo purposes, we're using dummy data instead of fetching from Firebase
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    // In a real app, we would fetch contacts here
    // For demo, we're using the dummy contacts defined above
  }, [currentUser, router]);

  // Load dummy messages when a contact is selected
  useEffect(() => {
    if (!selectedContact) return;
    
    // For demo purposes, only show messages for the first contact
    if (selectedContact.id === '1') {
      setMessages(dummyMessages);
    } else {
      // For other contacts, show fewer messages
      setMessages([
        {
          id: `${selectedContact.id}-1`,
          senderId: selectedContact.id,
          receiverId: currentUser?.uid || '',
          content: `Hello! I'm ${selectedContact.firstName}. Nice to connect with you!`,
          timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 120)),
          read: true
        },
        {
          id: `${selectedContact.id}-2`,
          senderId: currentUser?.uid || '',
          receiverId: selectedContact.id,
          content: `Hi ${selectedContact.firstName}! Thanks for reaching out. How can I help you?`,
          timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 115)),
          read: true
        },
        {
          id: `${selectedContact.id}-3`,
          senderId: selectedContact.id,
          receiverId: currentUser?.uid || '',
          content: selectedContact.lastMessage || 'Looking forward to chatting more!',
          timestamp: selectedContact.lastMessageTime || Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 30)),
          read: selectedContact.unreadCount === 0
        }
      ]);
    }
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [currentUser, selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message (demo version)
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
              <div className="p-8 text-center text-white/70">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-[#34D8F1]" />
                </div>
                <p className="text-lg font-medium text-white">No conversations yet</p>
                <p className="text-sm mt-2 text-white/70">
                  Your messages with other users will appear here
                </p>
              </div>
            ) : (
              <ul className="space-y-1 p-3">
                {contacts.map(contact => (
                  <li 
                    key={contact.id}
                    className={`px-4 py-3 rounded-xl hover:bg-white/15 cursor-pointer transition-all duration-200 ${selectedContact?.id === contact.id ? 'bg-white/20 shadow-lg' : ''}`}
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        {contact.profilePhotoUrl ? (
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/80 shadow-lg">
                            <Image 
                              src={contact.profilePhotoUrl} 
                              alt={`${contact.firstName} ${contact.lastName}`}
                              width={56}
                              height={56}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/80 shadow-lg">
                            <User className="h-7 w-7 text-white" />
                          </div>
                        )}
                        
                        {contact.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-[#34D8F1] text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold text-white border-2 border-white shadow-md">
                            {contact.unreadCount}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold truncate text-white text-base" style={{fontFamily: inter.style.fontFamily}}>
                            {contact.firstName} {contact.lastName}
                          </h3>
                          {contact.lastMessageTime && (
                            <span className="text-xs font-medium text-white/80 bg-white/10 px-2 py-1 rounded-full">
                              {new Date(contact.lastMessageTime.toMillis()).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        
                        {contact.lastMessage && (
                          <p className="text-sm text-white/90 truncate mt-1" style={{fontFamily: inter.style.fontFamily}}>
                            {contact.unreadCount > 0 ? (
                              <span className="font-medium">{contact.lastMessage}</span>
                            ) : (
                              contact.lastMessage
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
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
                
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                  {messages.map(message => (
                    <div 
                      key={message.id}
                      className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.senderId !== currentUser?.uid && (
                        <div className="flex-shrink-0 mr-2 self-end">
                          {selectedContact.profilePhotoUrl ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                              <Image 
                                src={selectedContact.profilePhotoUrl} 
                                alt={`${selectedContact.firstName}`}
                                width={32}
                                height={32}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#5A17E0] flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      )}
                      <div 
                        className={`max-w-[75%] p-3 ${
                          message.senderId === currentUser?.uid 
                            ? 'bg-[#5A17E0] text-white rounded-t-2xl rounded-l-2xl rounded-br-none' 
                            : 'bg-gray-100 text-gray-800 rounded-t-2xl rounded-r-2xl rounded-bl-none'
                        }`}
                      >
                        <p className="leading-relaxed" style={{fontFamily: inter.style.fontFamily}}>{message.content}</p>
                        <div className={`text-xs mt-1 flex items-center gap-1 ${
                          message.senderId === currentUser?.uid 
                            ? 'text-white/70 justify-end' 
                            : 'text-gray-500'
                        }`}>
                          {message.timestamp ? new Date(message.timestamp.toMillis()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Sending...'}
                          
                          {message.senderId === currentUser?.uid && message.read && (
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
