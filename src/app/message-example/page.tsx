'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, User } from 'lucide-react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function MessagingUIExample() {
  const router = useRouter();
  const [newMessage, setNewMessage] = useState('');

  // Example data
  const contacts = [
    {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      lastMessage: 'Looking forward to our coffee date!',
      lastMessageTime: new Date(),
      unreadCount: 2
    },
    {
      id: '2',
      firstName: 'Michael',
      lastName: 'Chen',
      lastMessage: 'How was your weekend?',
      lastMessageTime: new Date(Date.now() - 3600000), // 1 hour ago
      unreadCount: 0
    },
    {
      id: '3',
      firstName: 'Jessica',
      lastName: 'Williams',
      lastMessage: 'Thanks for the recommendation!',
      lastMessageTime: new Date(Date.now() - 86400000), // 1 day ago
      unreadCount: 0
    }
  ];

  const messages = [
    {
      id: 'm1',
      senderId: '1',
      content: 'Hi there! How are you doing today?',
      timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    },
    {
      id: 'm2',
      senderId: 'currentUser',
      content: 'I\'m doing great! Just finished a really productive meeting.',
      timestamp: new Date(Date.now() - 3600000 * 1.5), // 1.5 hours ago
    },
    {
      id: 'm3',
      senderId: '1',
      content: 'That sounds wonderful! What was the meeting about?',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    },
    {
      id: 'm4',
      senderId: 'currentUser',
      content: 'We were discussing the new project launch. It\'s going to be exciting!',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    },
    {
      id: 'm5',
      senderId: '1',
      content: 'Looking forward to our coffee date!',
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
    }
  ];

  const selectedContact = contacts[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B00CC] to-[#5A17E0] text-white">
      {/* Header */}
      <header className="p-4 flex items-center">
        <button 
          onClick={() => router.push('/dashboard')}
          className="mr-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold">Messages</h1>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
          <div className="flex h-[calc(100vh-160px)]">
            {/* Contacts List */}
            <div className="w-1/3 border-r border-white/10 overflow-y-auto">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-medium">Conversations</h2>
              </div>
              
              <ul>
                {contacts.map(contact => (
                  <li 
                    key={contact.id}
                    className={`p-4 hover:bg-white/5 cursor-pointer transition-colors ${contact.id === '1' ? 'bg-white/10' : ''}`}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        
                        {contact.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-[#34D8F1] text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {contact.unreadCount}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium truncate">
                            {contact.firstName} {contact.lastName}
                          </h3>
                          <span className="text-xs text-white/50">
                            {contact.lastMessageTime.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        {contact.lastMessage && (
                          <p className="text-sm text-white/70 truncate">
                            {contact.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Messages Area */}
            <div className="w-2/3 flex flex-col">
              {/* Contact Header */}
              <div className="p-4 border-b border-white/10 flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                
                <div className="ml-3">
                  <h3 className="font-medium">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h3>
                </div>
              </div>
              
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                  <div 
                    key={message.id}
                    className={`flex ${message.senderId === 'currentUser' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.senderId === 'currentUser' 
                          ? 'bg-[#34D8F1] text-[#3B00CC]' 
                          : 'bg-white/20'
                      }`}
                    >
                      <p style={{fontFamily: inter.style.fontFamily}}>{message.content}</p>
                      <div className={`text-xs mt-1 ${
                        message.senderId === 'currentUser' 
                          ? 'text-[#3B00CC]/70' 
                          : 'text-white/50'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/10 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#34D8F1]"
                    rows={1}
                    style={{fontFamily: inter.style.fontFamily}}
                  />
                  <button 
                    className="ml-2 p-3 rounded-full bg-[#34D8F1] text-[#3B00CC] hover:bg-[#34D8F1]/80 transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
