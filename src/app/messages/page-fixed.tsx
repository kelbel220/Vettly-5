'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, orderBy, getDocs, addDoc, onSnapshot, doc, getDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import Image from 'next/image';
import { ArrowLeft, Send, User, Menu } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-[#3B00CC] to-[#5A17E0] p-0 md:p-6">
      <div className="max-w-6xl mx-auto bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        {/* Mobile Header - Only visible on mobile */}
        {selectedContact && showConversation ? (
          <div className="flex items-center p-4 border-b border-white/10 md:hidden">
            <button 
              onClick={handleBackToContacts}
              className="mr-2 text-white"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              {selectedContact.profilePhotoUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Image 
                    src={selectedContact.profilePhotoUrl} 
                    alt={`${selectedContact.firstName} ${selectedContact.lastName}`}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xs">
                    {selectedContact.firstName.charAt(0)}{selectedContact.lastName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="ml-2">
                <h3 className="font-medium text-white" style={{fontFamily: inter.style.fontFamily}}>
                  {selectedContact.firstName} {selectedContact.lastName}
                </h3>
              </div>
            </div>
            <div className="ml-auto">
              <Menu className="h-6 w-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 border-b border-white/10 md:hidden">
            <h2 className="text-xl font-bold text-white" style={{fontFamily: inter.style.fontFamily}}>Messages</h2>
            <button className="text-white/70">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-12rem)]">
          {/* Contacts List */}
          <div className={`${showConversation ? 'hidden' : 'flex-1'} md:block md:w-1/3 md:border-r md:border-white/10 flex flex-col`}>
            <div className="hidden md:block p-5 border-b border-white/10">
              <h2 className="text-xl font-bold text-white" style={{fontFamily: inter.style.fontFamily}}>Messages</h2>
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
              <ul className="divide-y divide-white/10 space-y-2 p-2">
                {contacts.map(contact => (
                  <li 
                    key={contact.id}
                    className={`px-4 py-3 hover:bg-white/10 cursor-pointer transition-all duration-300 rounded-xl ${selectedContact?.id === contact.id ? 'bg-white/15 shadow-lg' : ''}`}
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        {contact.profilePhotoUrl ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden">
                            <Image 
                              src={contact.profilePhotoUrl} 
                              alt={`${contact.firstName} ${contact.lastName}`}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <span className="text-white text-sm">
                              {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                            </span>
                          </div>
                        )}
                        
                        {contact.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-[#34D8F1] text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium text-[#3B00CC]">
                            {contact.unreadCount}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium truncate text-white" style={{fontFamily: inter.style.fontFamily}}>
                            {contact.firstName} {contact.lastName}
                          </h3>
                          {contact.lastMessageTime && (
                            <span className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded-full">
                              {new Date(contact.lastMessageTime.toMillis()).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        
                        {contact.lastMessage && (
                          <p className="text-sm text-white/70 truncate" style={{fontFamily: inter.style.fontFamily}}>
                            {contact.lastMessage}
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
          <div className={`${!showConversation ? 'hidden' : 'flex-1'} md:block md:w-2/3 flex flex-col`}>
            {selectedContact ? (
              <>
                {/* Contact Header - Desktop Only */}
                <div className="hidden md:flex p-5 border-b border-white/10 items-center justify-between">
                  <div className="flex items-center">
                    {selectedContact.profilePhotoUrl ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden">
                        <Image 
                          src={selectedContact.profilePhotoUrl} 
                          alt={`${selectedContact.firstName} ${selectedContact.lastName}`}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-[#34D8F1]" />
                      </div>
                    )}
                    
                    <div className="ml-3">
                      <h3 className="font-semibold text-white" style={{fontFamily: inter.style.fontFamily}}>
                        {selectedContact.firstName} {selectedContact.lastName}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 px-3 py-1 rounded-full text-xs text-white/70">
                    Online
                  </div>
                </div>
                
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3 md:space-y-4 bg-gradient-to-b from-white/5 to-transparent">
                  {messages.map(message => (
                    <div 
                      key={message.id}
                      className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[70%] p-3 md:p-4 ${
                          message.senderId === currentUser?.uid 
                            ? 'bg-[#34D8F1] text-[#3B00CC] rounded-2xl rounded-br-none shadow-md' 
                            : 'bg-white/10 backdrop-blur-sm text-white rounded-2xl rounded-bl-none border border-white/5'
                        }`}
                      >
                        <p className="leading-relaxed" style={{fontFamily: inter.style.fontFamily}}>{message.content}</p>
                        <div className={`text-xs mt-1 md:mt-2 flex items-center gap-1 ${
                          message.senderId === currentUser?.uid 
                            ? 'text-[#3B00CC]/70 justify-end' 
                            : 'text-white/50'
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
                <div className="p-3 md:p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
                  <div className="flex items-center bg-white/10 rounded-xl p-1 pl-4 pr-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent resize-none focus:outline-none text-white"
                      rows={1}
                      style={{fontFamily: inter.style.fontFamily}}
                    />
                    <button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className={`p-3 rounded-xl ${
                        newMessage.trim() 
                          ? 'bg-[#34D8F1] text-[#3B00CC] hover:bg-[#34D8F1]/80' 
                          : 'bg-white/10 text-white/30'
                      } transition-all duration-300 shadow-md`}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* File attachment options */}
                  <div className="flex justify-between mt-3">
                    <button className="p-2 text-white/70 hover:text-[#34D8F1]">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    <button className="p-2 text-white/70 hover:text-[#34D8F1]">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button className="p-2 text-white/70 hover:text-[#34D8F1]">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                    <button className="p-2 text-white/70 hover:text-[#34D8F1]">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 rounded-xl bg-white/10 flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-12 h-12 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Select a conversation</h3>
                <p className="text-white/70 max-w-md">
                  Choose a contact from the list to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
