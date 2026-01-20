'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-bold">Something went wrong!</h2>
            <p className="text-muted-foreground text-center max-w-md">
                {error.message || "An unexpected error occurred while running the evaluation."}
            </p>
            <Button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
            >
                Try again
            </Button>
        </div>
    );
}
