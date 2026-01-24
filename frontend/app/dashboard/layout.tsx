"use client"

import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardMobileNav } from '@/components/layout/DashboardMobileNav';
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

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row bg-gray-50 dark:bg-zinc-950 h-screen overflow-hidden">
            <HackathonTour />
            {/* Mobile Navigation */}
            <DashboardMobileNav />

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
