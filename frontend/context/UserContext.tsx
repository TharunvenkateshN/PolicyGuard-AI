"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'Viewer' | 'Reviewer' | 'Policy Owner' | 'Admin';

export interface UserProfile {
    name: string;
    organization: string;
    role: UserRole;
    team: string;
    region: string;
    timezone: string;
}

interface UserContextType {
    profile: UserProfileEnhanced;
    updateProfile: (updates: Partial<UserProfileEnhanced>) => void;
}

const defaultProfile: UserProfile = {
    name: 'Executive User',
    organization: 'Acme Corp',
    role: 'Compliance Officer' as any, // Mapping "Compliance Officer" to custom for now, or just use string
    team: 'Risk & Compliance',
    region: 'Global',
    timezone: 'UTC',
};

// Fix role type for default if we want strictly typed, but "Compliance Officer" was in the mockup
// Let's adjust UserRole to include 'Compliance Officer' or keep it flexible string for display
// For the requirement "Role (Viewer / Reviewer / Policy Owner / Admin)", let's stick to those 
// but initialize with what was there or map it. 
// "Compliance Officer" sounds like a Job Title, not necessarily a System Role. 
// Let's add 'jobTitle' to separation.

export interface UserProfileEnhanced {
    name: string;
    organization: string;
    systemRole: UserRole; // The permission level
    jobTitle: string; // The display title (e.g. Compliance Officer)
    team: string;
    region: string;
    timezone: string;
}

const defaultProfileEnhanced: UserProfileEnhanced = {
    name: 'User',
    organization: 'Organization',
    systemRole: 'Viewer',
    jobTitle: 'Administrator',
    team: 'General',
    region: 'Global',
    timezone: 'UTC',
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<UserProfileEnhanced>(defaultProfileEnhanced);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('Lexinel_user_profile');
        if (saved) {
            try {
                setProfile(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse user profile", e);
            }
        }
        setIsLoaded(true);
    }, []);

    const updateProfile = (updates: Partial<UserProfileEnhanced>) => {
        setProfile(prev => {
            const newState = { ...prev, ...updates };
            localStorage.setItem('Lexinel_user_profile', JSON.stringify(newState));
            return newState;
        });
    };

    // Avoid hydration mismatch by rendering children only after load or dealing with it differently.
    // simpler: just return children, profile might flicker from default.

    return (
        <UserContext.Provider value={{ profile: profile as any, updateProfile: updateProfile as any }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
