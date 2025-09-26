'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '../../components/layouts/Layout';
import { Send, Paperclip, Image, Smile, Users, Phone, Video, MoreVertical, Search, Settings } from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isEdited?: boolean;
  isPinned?: boolean;
  reactions?: Record<string, string[]>;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'group' | 'direct';
  companyId: string;
  members: User[];
  lastMessage?: Message;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch chat rooms and company users
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Debug session data
        console.log('Session data:', session);
        console.log('User data:', session?.user);
        console.log('Company ID:', (session?.user as any)?.companyId);

        // Fetch or create company chat room
        const roomsResponse = await fetch('/api/chat/rooms');
        if (!roomsResponse.ok) {
          const errorData = await roomsResponse.json();
          console.error('Rooms API error:', errorData);
          throw new Error(`Failed to fetch chat rooms: ${errorData.error || 'Unknown error'}`);
        }

        const roomsData = await roomsResponse.json();
        console.log('Rooms data:', roomsData);
        
        if (roomsData.success && roomsData.rooms && roomsData.rooms.length > 0) {
          setChatRooms(roomsData.rooms);
          setActiveRoom(roomsData.rooms[0].id);
        } else {
          throw new Error('No chat rooms available');
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setError(`Failed to load chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchChatData();
    }
  }, [session]);

  // Fetch messages for active room
  useEffect(() => {
    if (!activeRoom) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat/messages?roomId=${activeRoom}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.messages) {
            setMessages(data.messages);
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [activeRoom]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: activeRoom,
          content: messageContent,
          type: 'text'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.message) {
          setMessages(prev => [...prev, data.message]);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', activeRoom);

    try {
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.message) {
          setMessages(prev => [...prev, data.message]);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId) return;

    try {
      const response = await fetch(`/api/chat/messages?messageId=${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message. Please try again.');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRoomData = chatRooms.find(room => room.id === activeRoom);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-mediumGray">Loading chat...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-redError text-6xl mb-4">⚠️</div>
            <p className="text-mediumGray mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-full bg-lightGray">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-darkGray">Messages</h1>
              <button 
                className="p-2 hover:bg-lightGray rounded-lg transition-colors"
                title="Chat Settings"
                aria-label="Open chat settings"
              >
                <Settings className="w-5 h-5 text-mediumGray" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-mediumGray" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Chat Rooms List */}
          <div className="flex-1 overflow-y-auto">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-lightGray transition-colors ${
                  activeRoom === room.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    {room.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-darkGray truncate">{room.name}</h3>
                      {room.lastMessage && (
                        <span className="text-xs text-mediumGray">
                          {formatTime(room.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-mediumGray truncate">
                        {room.lastMessage ? room.lastMessage.content : 'No messages yet'}
                      </p>
                      {room.unreadCount > 0 && (
                        <span className="bg-primary text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeRoomData ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      {activeRoomData.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-white"></div>
                      )}
                  </div>
                    
                  <div>
                      <h2 className="font-semibold text-darkGray">{activeRoomData.name}</h2>
                      <p className="text-sm text-mediumGray">
                        {activeRoomData.members.length} members
                    </p>
                  </div>
                </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      className="p-2 hover:bg-lightGray rounded-lg transition-colors"
                      title="Voice Call"
                      aria-label="Start voice call"
                    >
                      <Phone className="w-5 h-5 text-mediumGray" />
                    </button>
                    <button 
                      className="p-2 hover:bg-lightGray rounded-lg transition-colors"
                      title="Video Call"
                      aria-label="Start video call"
                    >
                      <Video className="w-5 h-5 text-mediumGray" />
                    </button>
                    <button 
                      className="p-2 hover:bg-lightGray rounded-lg transition-colors"
                      title="More Options"
                      aria-label="Open more options"
                    >
                      <MoreVertical className="w-5 h-5 text-mediumGray" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const isCurrentUser = message.senderId === (session?.user as any)?.id;
                  const showDate = index === 0 || 
                    formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="bg-lightGray text-mediumGray text-sm px-3 py-1 rounded-full">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex space-x-2 max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {!isCurrentUser && (
                            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm font-medium">
                                {message.senderName.charAt(0).toUpperCase()}
                              </span>
                  </div>
                        )}
                        
                          <div className={`rounded-lg px-4 py-2 ${
                            isCurrentUser 
                              ? 'bg-primary text-white' 
                              : 'bg-white border border-gray-200 text-darkGray'
                          }`}>
                            {!isCurrentUser && (
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {message.senderName}
                              </p>
                            )}
                            
                            {message.type === 'image' && message.fileUrl ? (
                              <div className="space-y-2">
                            <img
                              src={message.fileUrl}
                                  alt={message.fileName || 'Image'} 
                                  className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(message.fileUrl, '_blank')}
                            />
                                <p className="text-sm text-gray-600">{message.fileName}</p>
                                  </div>
                            ) : message.type === 'file' && message.fileUrl ? (
                              <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
                                <Paperclip className="w-4 h-4 text-gray-500" />
                                <a 
                                  href={message.fileUrl} 
                                  download={message.fileName}
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  {message.fileName}
                                </a>
                          </div>
                            ) : (
                              <p className="text-sm">{message.content}</p>
                        )}
                      
                            <p className={`text-xs mt-1 ${
                              isCurrentUser ? 'text-white/70' : 'text-mediumGray'
                            }`}>
                          {formatTime(message.timestamp)}
                        </p>
                          </div>
                      </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-lightGray rounded-lg transition-colors"
                      title="Attach File"
                      aria-label="Attach file to message"
                    >
                      <Paperclip className="w-5 h-5 text-mediumGray" />
                    </button>
                  
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2 hover:bg-lightGray rounded-lg transition-colors"
                      title="Attach Image"
                      aria-label="Attach image to message"
                    >
                      <Image className="w-5 h-5 text-mediumGray" />
                    </button>
                  
                  <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="p-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Send Message"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-16 h-16 text-mediumGray mx-auto mb-4" />
                <h3 className="text-lg font-medium text-darkGray mb-2">No chat selected</h3>
                <p className="text-mediumGray">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
        title="Select file to upload"
        aria-label="Select file to upload"
      />
      <input
        ref={imageInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*"
        title="Select image to upload"
        aria-label="Select image to upload"
      />
    </Layout>
  );
}
