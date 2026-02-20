"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Settings functionality has been migrated to Integration Hub
export default function SettingsRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/dashboard/proxy'); }, [router]);
    return (
        <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground text-sm">Redirecting to Integration Hub…</p>
        </div>
    );
}
