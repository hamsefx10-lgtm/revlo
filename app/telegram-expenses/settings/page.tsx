'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/layouts/Layout';
import { Loader2, Plus, Save, ShieldCheck, Ban, RefreshCw } from 'lucide-react';
import Toast from '@/components/common/Toast';

interface TelegramChat {
  id: string;
  chatId: string;
  chatName?: string;
  chatType?: string;
  active: boolean;
  defaultProjectId?: string | null;
  defaultProject?: { id: string; name: string };
}

interface TelegramUserLink {
  id: string;
  telegramUserId: string;
  telegramDisplayName?: string;
  telegramUsername?: string;
  status: 'PENDING' | 'APPROVED' | 'BLOCKED';
  createdAt: string;
  user?: { id: string; fullName: string };
}

interface Project {
  id: string;
  name: string;
}

const statusLabels: Record<TelegramUserLink['status'], string> = {
  PENDING: 'Sugaya',
  APPROVED: 'La oggolaaday',
  BLOCKED: 'La xanibay',
};

export default function TelegramSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [users, setUsers] = useState<TelegramUserLink[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [chatForm, setChatForm] = useState({ chatId: '', chatName: '', chatType: 'supergroup', defaultProjectId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [chatsRes, usersRes, projectsRes] = await Promise.all([
        fetch('/api/telegram/chats'),
        fetch('/api/telegram/users'),
        fetch('/api/projects'),
      ]);

      if (chatsRes.ok) {
        const data = await chatsRes.json();
        setChats(data.chats || []);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects((data.projects || []).map((project: any) => ({ id: project.id, name: project.name })));
      }
    } catch (error) {
      console.error('Telegram settings fetch error', error);
      setToast({ message: 'Cilad ayaa dhacday xogta la soo saarayo', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleChatSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/telegram/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatForm),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Xidhiidhinta chat-ka way fashilantay.');
      }
      setToast({ message: 'Chat si guul leh ayaa loo kaydiyay!', type: 'success' });
      setChatForm({ chatId: '', chatName: '', chatType: 'supergroup', defaultProjectId: '' });
      fetchAll();
    } catch (error: any) {
      setToast({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const updateChat = async (chatId: string, updates: Partial<TelegramChat>) => {
    try {
      const response = await fetch(`/api/telegram/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Lama cusboonaysiin karo chat-kan.');
      }
      fetchAll();
    } catch (error: any) {
      setToast({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
    }
  };

  const updateUserStatus = async (id: string, status: TelegramUserLink['status']) => {
    try {
      const response = await fetch(`/api/telegram/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Lama cusboonaysiin karo isticmaalahan.');
      }
      fetchAll();
    } catch (error: any) {
      setToast({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dejinta Telegram</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ku xidh kooxaha Telegram mashruucyada Revlo.</p>
          </div>
          <button
            onClick={fetchAll}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Cusboonaysii
          </button>
        </div>

        {/* Chat link form */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ku dar/ cusboonaysii chat
          </h2>
          <form onSubmit={handleChatSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chat ID</label>
              <input
                type="text"
                value={chatForm.chatId}
                onChange={(e) => setChatForm({ ...chatForm, chatId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2"
                placeholder="-100123456789"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Magaca chat-ka</label>
              <input
                type="text"
                value={chatForm.chatName}
                onChange={(e) => setChatForm({ ...chatForm, chatName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2"
                placeholder="Kooxda Mashruuca A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mashruuca Default</label>
              <select
                value={chatForm.defaultProjectId}
                onChange={(e) => setChatForm({ ...chatForm, defaultProjectId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2"
              >
                <option value="">-- Doorasho --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-4 py-2 font-semibold disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Kaydi
              </button>
            </div>
          </form>
        </section>

        {/* Chats table */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Kooxaha la diiwaangeliyay</h2>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : chats.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Wax xiriir ah wali lama sameyn.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 uppercase tracking-wide text-xs">
                    <th className="pb-2">Chat</th>
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Mashruuca Default</th>
                    <th className="pb-2">Xaalad</th>
                    <th className="pb-2">Falal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {chats.map((chat) => (
                    <tr key={chat.id}>
                      <td className="py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{chat.chatName || '—'}</div>
                        <p className="text-xs text-gray-500">{chat.chatType || 'group'}</p>
                      </td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">{chat.chatId}</td>
                      <td className="py-3">
                        <select
                          value={chat.defaultProjectId || ''}
                          onChange={(e) => updateChat(chat.chatId, { defaultProjectId: e.target.value || null })}
                          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm"
                        >
                          <option value="">—</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            chat.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {chat.active ? 'Firfircoon' : 'La demiyay'}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => updateChat(chat.chatId, { active: !chat.active })}
                          className="px-3 py-1 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          {chat.active ? 'Demi' : 'Daar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Users table */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Isticmaalayaasha Telegram
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Ma jiraan isticmaalayaal sugaya ansixin.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 uppercase tracking-wide text-xs">
                    <th className="pb-2">Magaca</th>
                    <th className="pb-2">Username</th>
                    <th className="pb-2">Telegram ID</th>
                    <th className="pb-2">Xaalad</th>
                    <th className="pb-2">Falal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="py-3 text-gray-900 dark:text-gray-100">{user.telegramDisplayName || '—'}</td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">@{user.telegramUsername || '—'}</td>
                      <td className="py-3 text-gray-500">{user.telegramUserId}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : user.status === 'BLOCKED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {statusLabels[user.status]}
                        </span>
                      </td>
                      <td className="py-3 space-x-2">
                        <button
                          onClick={() => updateUserStatus(user.id, 'APPROVED')}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-100 text-green-800 text-xs"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          Ansixi
                        </button>
                        <button
                          onClick={() => updateUserStatus(user.id, 'BLOCKED')}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs"
                        >
                          <Ban className="w-3 h-3" />
                          Xanib
                        </button>
                        <button
                          onClick={() => updateUserStatus(user.id, 'PENDING')}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-yellow-100 text-yellow-700 text-xs"
                        >
                          Sug
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}

