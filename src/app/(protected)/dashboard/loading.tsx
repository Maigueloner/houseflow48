import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto">
            {/* Header / Month Navigation Placeholder */}
            <div className="flex justify-between items-end">
                <Skeleton className="h-10 w-48 rounded-2xl" />
                <Skeleton className="h-6 w-32 rounded-full" />
            </div>

            {/* Hero Card Placeholder */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm overflow-hidden relative">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Action Buttons or Alert Placeholder */}
            <Skeleton className="h-16 w-full rounded-2xl" />

            {/* Goal Progress Placeholder */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>

            {/* List Header + Transaction List Placeholder */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                </div>
                <div className="divide-y divide-gray-100">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-12 ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analytics Accordion Placeholder */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                 <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="w-5 h-5 rounded-full" />
                </div>
            </div>
        </div>
    );
}
