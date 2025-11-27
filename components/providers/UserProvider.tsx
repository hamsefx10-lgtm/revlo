'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

interface UserType {
  id: string;
  fullName: string;
  email: string;
  role: string;
  companyId?: string;
  companyName?: string;
  avatar?: string;
  companyLogoUrl?: string;
}

interface UserContextType {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: (session.user as any).id ?? '',
        fullName: session.user.name || '',
        email: session.user.email ?? '',
        role: (session.user as any).role ?? '',
        companyId: (session.user as any).companyId,
        companyName: (session.user as any).companyName,
        avatar: (session.user as any).avatar,
        companyLogoUrl: (session.user as any).companyLogoUrl,
      });
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [session, status]);

  const logout = () => {
    setUser(null);
    signOut({ callbackUrl: '/' });
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};