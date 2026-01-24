'use client';

import React from "react"
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showConfirmScreen, setShowConfirmScreen] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        toast({
          title: 'Error',
          description: signUpError.message,
          variant: 'destructive',
        });
      } else {
        // Show confirmation UI instructing the user to check their email
        setSignedUpEmail(email);
        setShowConfirmScreen(true);
        toast({
          title: 'Success',
          description: 'Account created. Check your email to confirm your account.',
        });

        // If Supabase returned a user id (may be present depending on confirmation flow),
        // try to create a profile row so we can display the user's full name in the app.
        try {
          const userId = (data as any)?.user?.id;
          if (userId) {
            await supabase.from('profiles').upsert([
              { id: userId, full_name: fullName },
            ]);
          }
        } catch (err) {
          // Non-fatal: profile creation can be handled later (e.g. on first sign-in or via DB trigger)
          // eslint-disable-next-line no-console
          console.warn('Could not create profile row:', err);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!signedUpEmail) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signedUpEmail,
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Confirmation email resent. Please check your inbox.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold mx-auto mb-4">
              L&F
            </div>
            <h1 className="text-2xl font-bold text-foreground">Confirm your email</h1>
            <p className="mt-2 text-muted-foreground">We sent a confirmation link to <strong>{signedUpEmail}</strong>. Please open your inbox (Gmail) and click the link to activate your account.</p>
          </div>

          <Card>
            <CardContent>
              <div className="space-y-4">
                <Button asChild>
                  <a href="https://mail.google.com/" target="_blank" rel="noreferrer" className="w-full text-center">Open Gmail</a>
                </Button>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleResend}
                  disabled={loading}
                >
                  {loading ? 'Resending...' : 'Resend confirmation instructions'}
                </Button>

                <Button className="w-full" onClick={() => router.push('/auth/login')}>
                  I confirmed — Go to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold mx-auto mb-4">
            L&F
          </div>
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="mt-2 text-muted-foreground">
            Join Campus Lost & Found to report or find items
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create an account in just a few steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
