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
    isJudge: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: async () => { },
    signup: async () => { },
    logout: async () => { },
    loginAsGuest: async () => { },
    isJudge: false,
    isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // Synchronous initialization to prevent "null flash" redirect
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('pg_auth_user');
            if (cached) {
                try { return JSON.parse(cached); } catch (e) { return null; }
            }
        }
        return null;
    });

    const [isLoading, setIsLoading] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('pg_auth_user'); // Only load if nothing cached
        }
        return true;
    });

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
            const isLocalMode = process.env.NEXT_PUBLIC_USE_FIREBASE !== 'true';
            if (isLocalMode) {
                console.log("🔑 Auth: Local Mode Active (Guest Auth only)");
            } else {
                console.error("❌ Firebase Auth not initialized");
            }
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
        if (!auth) {
            // Support a mock login for testing even in local mode (Universal Access)
            const mockUser: any = {
                uid: `mock_${email.split('@')[0]}`,
                email: email,
                displayName: email.split('@')[0],
                emailVerified: true,
                isAnonymous: false,
            };
            setUser(mockUser);
            localStorage.setItem('pg_auth_user', JSON.stringify(mockUser));
            router.push('/dashboard');
            return;
        }

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
        localStorage.setItem('pg_auth_user', JSON.stringify(mockUser));
        localStorage.setItem('pg_is_judge', 'true');

        // Give state time to propagate
        await new Promise(r => setTimeout(r, 150));
        router.push('/dashboard');
    };

    const signup = async (email: string, password: string, name: string) => {
        if (!auth) {
            // Local Mode Signup Logic
            const mockUser: any = {
                uid: `local_user_${Date.now()}`,
                email: email,
                displayName: name,
                emailVerified: false,
                isAnonymous: false,
            };
            setUser(mockUser);
            localStorage.setItem('pg_auth_user', JSON.stringify(mockUser));
            router.push('/dashboard');
            return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
    };

    const logout = async () => {
        if (auth) {
            await signOut(auth);
        }
        setUser(null);
        localStorage.removeItem('pg_auth_user');
        localStorage.removeItem('pg_tour_active');
        localStorage.removeItem('pg_is_judge');
        router.push('/login');
    };

    const isJudge = !!user && (typeof window !== 'undefined' && localStorage.getItem('pg_is_judge') === 'true');

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, isLoading, loginAsGuest, isJudge }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
