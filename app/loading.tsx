import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Skeleton */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <section className="px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <Skeleton className="h-12 w-40 mx-auto" />
          <Skeleton className="h-16 w-full max-w-2xl mx-auto" />
          <Skeleton className="h-6 w-full max-w-md mx-auto" />
          <div className="flex gap-4 justify-center">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </section>
    </div>
  );
}
