"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  address?: any;
  // Add other fields as needed
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  loading: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Example: Load user from localStorage or API
    const stored = localStorage.getItem("user");
    if (stored && stored !== "undefined") {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        setUser(null);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      loading, 
      isLoggedIn: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};