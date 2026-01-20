import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <h2 className="text-xl font-bold text-muted-foreground">Loading Evaluation Engine...</h2>
        </div>
    );
}
