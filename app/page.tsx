import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, MessageCircle, Search, Upload } from 'lucide-react';
import { Suspense } from 'react';
import Brand from '@/components/site/brand';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div>
              <Brand />
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-block rounded-full bg-primary/10 px-4 py-2">
            <span className="text-sm font-semibold text-primary">Help Your Community</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Find Your Lost Items on Campus
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Connect with your community to recover lost belongings. Report, browse, and help others find what matters to them.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 sm:w-auto">
                Start Reporting
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Browse Items
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-3xl font-bold text-foreground">How It Works</h2>
            <p className="text-lg text-muted-foreground">Simple steps to find or report items</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Upload className="h-6 w-6" />
                </div>
                <CardTitle>Report Items</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Upload a photo and describe your lost or found item</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Search className="h-6 w-6" />
                </div>
                <CardTitle>Browse Items</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Search through reported items by category or location</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <CardTitle>Connect</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Message other users to arrange item handover</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Heart className="h-6 w-6" />
                </div>
                <CardTitle>Reunite</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Get your belongings back or help someone find theirs</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/30 px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Why Choose Us?</h2>
            <p className="text-lg text-muted-foreground">Built for your campus community</p>
          </div>

          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">Campus-Wide Network</h3>
              <p className="text-muted-foreground">
                Connect with students and staff across your entire campus to maximize your chances of recovery.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">Photo-Based Searching</h3>
              <p className="text-muted-foreground">
                Upload photos of your items to make them easier to identify and increase recovery rates.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">Instant Messaging</h3>
              <p className="text-muted-foreground">
                Direct messaging system to quickly coordinate item handovers without sharing personal contact details.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">Smart Categorization</h3>
              <p className="text-muted-foreground">
                Organize items by category and location to make browsing and searching faster and easier.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">Community Driven</h3>
              <p className="text-muted-foreground">
                Built by and for your campus community to help everyone recover their valuable belongings.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">Secure Platform</h3>
              <p className="text-muted-foreground">
                Your data is protected with secure authentication and privacy-first design principles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-foreground">Ready to Recover Your Items?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join your campus community today and start browsing or reporting items.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 sm:w-auto">
                Sign Up Now
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Already a Member?
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                L&F
              </div>
              <span className="font-semibold text-foreground">Campus Lost & Found</span>
            </div>
            <p className="text-sm text-muted-foreground text-center sm:text-right">
              Helping your campus community reunite with lost items since 2024
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Loading handled by `app/loading.tsx`
