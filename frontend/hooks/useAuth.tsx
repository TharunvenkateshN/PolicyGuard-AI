"use client"

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User
} from 'firebase/auth';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    loginAsGuest: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: async () => { },
    signup: async () => { },
    logout: async () => { },
    loginAsGuest: async () => { },
    isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Optimistic Auth: Check localStorage first to avoid delay
        const cachedUser = localStorage.getItem('pg_auth_user');
        if (cachedUser) {
            try {
                setUser(JSON.parse(cachedUser));
                setIsLoading(false); // Instant load!
            } catch (e) {
                console.error("Failed to parse cached user");
            }
        }

        // @ts-ignore - firebase auth type safety
        if (!auth) {
            console.error("Firebase Auth not initialized");
            if (!cachedUser) setIsLoading(false);
            return;
        }

        // Listen for Firebase Auth state changes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const serializableUser: any = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    emailVerified: firebaseUser.emailVerified,
                    isAnonymous: firebaseUser.isAnonymous,
                };
                setUser(serializableUser);
                localStorage.setItem('pg_auth_user', JSON.stringify(serializableUser));
            } else {
                // Only clear if we were not using mock user previously or if explicit logout
                // For now, sync truth with firebase
                // But don't clear immediately if we suspect network flake?
                // Standard behavior: clear.
                // setUser(null); // Let logout handle explicit clear
            }
            setIsLoading(false);
        });

        // Safety Timeout
        const safetyTimeout = setTimeout(() => {
            setIsLoading((prev) => {
                if (prev) {
                    console.warn("Auth check timed out - defaulting to Guest Mode (Offline Fallback)");
                    const mockUser: any = {
                        uid: 'guest_fallback',
                        email: 'guest@offline.com',
                        displayName: 'Guest User',
                        emailVerified: true,
                        isAnonymous: true,
                    };
                    setUser(mockUser);
                    localStorage.setItem('pg_auth_user', JSON.stringify(mockUser));
                    return false;
                }
                return prev;
            });
        }, 1500);

        return () => {
            clearTimeout(safetyTimeout);
            unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
    };

    const loginAsGuest = async () => {
        // Mock User for Hackathon Test Mode
        const mockUser: any = {
            uid: 'guest_judge_1',
            email: 'judge@hackathon.com',
            displayName: 'Hackathon Judge',
            emailVerified: true,
            isAnonymous: true,
        };
        setUser(mockUser);
        router.push('/dashboard');
    };

    const signup = async (email: string, password: string, name: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        localStorage.removeItem('pg_auth_user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, isLoading, loginAsGuest }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
