import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="inline-flex items-center text-sm mb-4">
          <ChevronLeft className="h-4 w-4" />
          <Skeleton className="h-4 w-16 ml-1" />
        </div>

        <Skeleton className="h-8 w-32 mb-6" />

        <div className="space-y-6">
          {/* Photo Section */}
          <div className="bg-card rounded-lg border p-6">
            <Skeleton className="h-5 w-24 mb-3" />
            <div className="flex items-center gap-4">
              <Skeleton className="w-24 h-24 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}
