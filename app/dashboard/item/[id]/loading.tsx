import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 text-muted-foreground mb-8 group">
          <ArrowLeft className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Image Column */}
          <div className="lg:col-span-3">
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <div className="mt-8">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <Skeleton className="h-10 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2" />
            </div>

            <div className="space-y-4">
              <Skeleton className="h-32 rounded-xl" />
            </div>

            <div className="rounded-xl border p-6">
              <Skeleton className="h-5 w-20 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
