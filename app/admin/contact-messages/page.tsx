'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { 
  ArrowLeft, Mail, Search, Filter, RefreshCw, Eye, CheckCircle, 
  XCircle, Clock, User, MessageSquare, Calendar
} from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [filterRead]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const url = filterRead !== 'all' 
        ? `/api/contact?read=${filterRead === 'read'}` 
        : '/api/contact';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: messageId, read: true }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        ));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const unreadCount = messages.filter(msg => !msg.read).length;
  const totalCount = messages.length;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100 flex items-center">
          <Link href="/admin" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Fariimaha Xiriirka
        </h1>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center disabled:opacity-50"
        >
          <RefreshCw size={20} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <Mail className="mx-auto text-primary mb-2" size={32} />
          <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100">{totalCount}</h3>
          <p className="text-mediumGray dark:text-gray-400">Wadarta Fariimaha</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <Clock className="mx-auto text-yellow-600 mb-2" size={32} />
          <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100">{unreadCount}</h3>
          <p className="text-mediumGray dark:text-gray-400">Aan La Aqrin</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
          <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100">{totalCount - unreadCount}</h3>
          <p className="text-mediumGray dark:text-gray-400">La Aqriyay</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Raadi fariimaha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-darkGray dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-darkGray dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="all">Dhammaan</option>
              <option value="unread">Aan La Aqrin</option>
              <option value="read">La Aqriyay</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="mx-auto animate-spin text-primary mb-4" size={32} />
            <p className="text-mediumGray dark:text-gray-400">Waa la soo gelinayaa...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="mx-auto text-mediumGray dark:text-gray-400 mb-4" size={48} />
            <p className="text-mediumGray dark:text-gray-400 text-lg">Ma jiro fariin la heli karo.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`p-6 hover:bg-lightGray dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                  !message.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
                onClick={() => {
                  setSelectedMessage(message);
                  if (!message.read) {
                    markAsRead(message.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {!message.read && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                      )}
                      <h3 className="font-bold text-darkGray dark:text-white text-lg truncate">
                        {message.subject}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-mediumGray dark:text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <User size={16} />
                        <span>{message.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail size={16} />
                        <span>{message.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>{new Date(message.createdAt).toLocaleDateString('so-SO')}</span>
                      </div>
                    </div>
                    <p className="text-mediumGray dark:text-gray-400 line-clamp-2">
                      {message.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {message.read ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <Clock className="text-yellow-600" size={20} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMessage(null)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-darkGray dark:text-white">
                  {selectedMessage.subject}
                </h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-white"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-2 text-sm text-mediumGray dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span className="font-semibold">Magaca:</span>
                  <span>{selectedMessage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span className="font-semibold">Email:</span>
                  <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline">
                    {selectedMessage.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span className="font-semibold">Taariikh:</span>
                  <span>{new Date(selectedMessage.createdAt).toLocaleString('so-SO')}</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-darkGray dark:text-white mb-3 flex items-center gap-2">
                <MessageSquare size={20} />
                Fariinta
              </h3>
              <p className="text-mediumGray dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                {selectedMessage.message}
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Jawaab Email
              </a>
              <button
                onClick={() => setSelectedMessage(null)}
                className="bg-gray-200 dark:bg-gray-700 text-darkGray dark:text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Xidh
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

