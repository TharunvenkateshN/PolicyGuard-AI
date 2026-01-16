"use client"

import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { HackathonTour } from '@/components/onboarding/HackathonTour';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) return null;

    return (
        <div className="flex flex-col lg:flex-row bg-gray-50 dark:bg-zinc-950 h-screen overflow-hidden">
            <HackathonTour />
            {/* Mobile Navigation */}
            <MobileNav />

            {/* Desktop Sidebar */}
            <Sidebar className="hidden lg:flex h-screen sticky top-0" />

            <main className="flex-1 overflow-y-auto w-full">
                <div className="mx-auto max-w-7xl p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
