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
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: async () => { },
    signup: async () => { },
    logout: async () => { },
    isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!auth) {
            console.error("Firebase Auth not initialized");
            setIsLoading(false);
            return;
        }

        // Listen for Firebase Auth state changes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setIsLoading(false);
        });

        return () => unsubscribe();
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
        setUser(null); // Explicitly clear for guest mode
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, isLoading, loginAsGuest }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
