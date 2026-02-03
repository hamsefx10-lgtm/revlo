'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layouts/Layout';
import { Send, Paperclip, Image, Users, Phone, Video, MoreVertical, Search, ArrowLeft, Mic } from 'lucide-react';

// --- Interfaces ---
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

  // Data States
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  // UI States
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // --- Initial Data Fetching ---
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setIsLoading(true);
        const roomsResponse = await fetch('/api/chat/rooms');
        const roomsData = await roomsResponse.json();
        if (roomsData.success && roomsData.rooms) {
          setChatRooms(roomsData.rooms);
          if (roomsData.rooms.length > 0) setActiveRoom(roomsData.rooms[0].id);
        }
      } catch (e: any) { console.error('Error fetching chat:', e); }
      finally { setIsLoading(false); }
    };
    if (session?.user) fetchChatData();
  }, [session]);

  // --- Fetch Messages ---
  useEffect(() => {
    if (!activeRoom) return;
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat/messages?roomId=${activeRoom}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.messages) setMessages(data.messages);
        }
      } catch (error) { console.error(error); }
    };
    fetchMessages();
  }, [activeRoom]);

  // --- Auto Scroll ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Handlers ---
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !activeRoom) return;
    const content = newMessage.trim();
    setIsSending(true);

    try {
      if (editingMessageId) {
        const response = await fetch('/api/chat/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: editingMessageId, content }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMessages(prev => prev.map(m => m.id === editingMessageId ? data.message : m));
            setEditingMessageId(null);
            setNewMessage('');
          }
        }
      } else {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: activeRoom, content, type: 'text' }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMessages(prev => [...prev, data.message]);
            setNewMessage('');
          }
        }
      }
    } catch (error) { console.error('Send error:', error); }
    finally { setIsSending(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', activeRoom);
    try {
      const res = await fetch('/api/chat/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setMessages(prev => [...prev, data.message]);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/messages?messageId=${id}`, { method: 'DELETE' });
      if (res.ok) setMessages(prev => prev.filter(m => m.id !== id));
    } catch (e) { console.error(e); }
  };

  const formatTime = (d: Date) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: Date) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });

  const filteredRooms = chatRooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeRoomData = chatRooms.find(r => r.id === activeRoom);

  if (isLoading) return <Layout><div className="flex bg-lightGray items-center justify-center p-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div></Layout>;

  return (
    <Layout>
      {/* 
        Changes Made for Seamless Integration:
        1. Removed outer margins/padding that constrained it.
        2. Set height to use available viewport height, accounting for main Topbar.
        3. Removed outer shadows and borders to blend with page background.
        4. Structured as a split view that naturally sits on the background.
      */}
      <div className="flex h-[calc(100vh-120px)] w-full gap-0 md:gap-4 overflow-hidden">

        {/* --- LEFT SIDEBAR (List) --- */}
        <div className={`
            flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700
            w-full md:w-80 flex-shrink-0
            ${activeRoom ? 'hidden md:flex' : 'flex'}
        `}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-lg font-bold text-darkGray dark:text-white mb-3">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder-gray-400"
              />
            </div>
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No chats found.</div>
            ) : (
              filteredRooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`
                            px-4 py-4 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50
                            ${activeRoom === room.id ? 'bg-blue-50/60 dark:bg-gray-700/60' : ''}
                        `}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${activeRoom === room.id ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300'}`}>
                        {room.avatar ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={room.avatar} alt={room.name} className="w-full h-full rounded-full object-cover" />
                        ) : <Users size={20} />}
                      </div>
                      {room.isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`font-semibold truncate ${activeRoom === room.id ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                          {room.name}
                        </h3>
                        {room.lastMessage && <span className="text-[11px] text-gray-400 font-medium">{formatTime(room.lastMessage.timestamp)}</span>}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-xs truncate max-w-[140px] ${room.unreadCount > 0 ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500'}`}>
                          {room.lastMessage?.content || <span className="italic">No messages yet</span>}
                        </p>
                        {room.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{room.unreadCount}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- RIGHT AREA (Chat) --- */}
        <div className={`
            flex-1 flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 relative
            ${!activeRoom ? 'hidden md:flex' : 'flex'}
        `}>
          {activeRoomData ? (
            <>
              {/* Chat Topbar - Seamlessly Integrated */}
              <div className="h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveRoom('')} className="md:hidden text-gray-500 hover:text-darkGray">
                    <ArrowLeft size={24} />
                  </button>

                  <div className="flex flex-col">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{activeRoomData.name}</h3>
                    <p className="text-xs text-green-500 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><Phone size={20} /></button>
                  <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><Video size={20} /></button>
                  <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><MoreVertical size={20} /></button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-800">
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === (session?.user as any)?.id;
                  const showDate = i === 0 || formatDate(msg.timestamp) !== formatDate(messages[i - 1].timestamp);

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-6">
                          <span className="text-[11px] font-bold text-gray-400 px-3 py-1 bg-gray-50 dark:bg-gray-700 rounded-full uppercase tracking-wide">
                            {formatDate(msg.timestamp)}
                          </span>
                        </div>
                      )}

                      <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[80%] md:max-w-[60%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex-shrink-0 flex items-center justify-center text-xs font-bold border border-indigo-200 dark:border-indigo-800/50">
                              {msg.senderName.charAt(0)}
                            </div>
                          )}

                          <div className={`
                                            p-4 rounded-2xl text-sm leading-relaxed relative group shadow-sm
                                            ${isMe
                              ? 'bg-primary text-white rounded-tr-sm'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-tl-sm'
                            }
                                        `}>
                            {/* File/Image */}
                            {msg.type === 'image' && msg.fileUrl ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={msg.fileUrl} alt="attachment" className="rounded-lg max-w-full mb-2 cursor-pointer hover:opacity-95" onClick={() => window.open(msg.fileUrl!, '_blank')} />
                              </>
                            ) : msg.type === 'file' ? (
                              <div className={`flex items-center gap-2 p-3 rounded-lg mb-1 ${isMe ? 'bg-white/20' : 'bg-white border border-gray-200'}`}>
                                <Paperclip size={16} /> <a href={msg.fileUrl} download={msg.fileName} className="underline decoration-dotted font-medium truncate">{msg.fileName}</a>
                              </div>
                            ) : (
                              msg.content
                            )}

                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'opacity-70 text-white' : 'text-gray-400'}`}>
                              {formatTime(msg.timestamp)}
                              {msg.isEdited && <span>(edited)</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 sticky bottom-0 z-20">
                <div className="flex items-end gap-3 max-w-5xl mx-auto bg-gray-50 dark:bg-gray-700/30 p-2 pl-4 rounded-[26px] border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none resize-none py-3 text-sm text-darkGray dark:text-white placeholder-gray-400 max-h-32"
                    style={{ minHeight: '44px' }}
                  />
                  <div className="flex items-center gap-1 pr-2 pb-2">
                    <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
                    <input ref={imageInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />

                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"><Paperclip size={20} /></button>
                    <button onClick={() => imageInputRef.current?.click()} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"><Image size={20} /></button>

                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className={`p-2.5 rounded-full ml-1 transition-all flex item-center justify-center ${newMessage.trim() ? 'bg-primary text-white shadow-lg shadow-blue-500/30 hover:scale-105' : 'bg-gray-200 text-gray-400 dark:bg-gray-600'}`}
                    >
                      <Send size={18} className={isSending ? 'animate-pulse' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800">
              <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <Users size={40} className="text-gray-300 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-darkGray dark:text-white mb-2">Select a Conversation</h3>
              <p className="text-gray-400 text-center max-w-xs text-sm">Choose from your contacts to start messaging.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
      `}</style>
    </Layout>
  );
}
