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
  const [retryAfter, setRetryAfter] = useState(0);

  // Load cooldown from localStorage on mount (for both signup and resend)
  React.useEffect(() => {
    // Check both signup and resend cooldowns
    const signupCooldown = localStorage.getItem('signup_cooldown');
    const resendCooldown = localStorage.getItem('resend_cooldown');
    
    // Use whichever cooldown is longer
    const cooldowns = [signupCooldown, resendCooldown].filter(Boolean).map(c => parseInt(c!, 10));
    
    if (cooldowns.length > 0) {
      const maxCooldown = Math.max(...cooldowns);
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((maxCooldown - now) / 1000));
      
      if (remaining > 0) {
        setRetryAfter(remaining);
      } else {
        localStorage.removeItem('signup_cooldown');
        localStorage.removeItem('resend_cooldown');
      }
    }
  }, []);

  React.useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            localStorage.removeItem('signup_cooldown');
            localStorage.removeItem('resend_cooldown');
          }
          return newValue;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

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
        // Check for rate limit error (status 429)
        if (signUpError.status === 429) {
          const cooldownEnd = Date.now() + 60000;
          localStorage.setItem('signup_cooldown', cooldownEnd.toString());
          setRetryAfter(60); // 60 seconds cooldown
          toast({
            title: 'Too Many Requests',
            description: 'Please wait 60 seconds before trying to sign up again.',
            variant: 'destructive',
          });
        } else if (signUpError.message?.includes('User already registered')) {
          // User already exists - show confirmation screen so they can resend
          setSignedUpEmail(email);
          setShowConfirmScreen(true);
          toast({
            title: 'Account Already Exists',
            description: 'This email is already registered. Check your inbox for the confirmation email, or resend it below.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: signUpError.message,
            variant: 'destructive',
          });
        }
      } else {
        // Show confirmation UI instructing the user to check their email
        setSignedUpEmail(email);
        setShowConfirmScreen(true);
        toast({
          title: 'Success',
          description: 'Account created. Check your email to confirm your account.',
        });
        // Note: Profile creation is handled automatically by a database trigger
        // (handle_auth_user_insert) that runs when the user is created in auth.users.
        // The full_name is extracted from the user metadata we passed in options.data above.
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
        if (error.status === 429) {
          const cooldownEnd = Date.now() + 60000; // 60 seconds from now
          localStorage.setItem('resend_cooldown', cooldownEnd.toString());
          setRetryAfter(60); // 60 seconds cooldown
          toast({
            title: 'Too Many Requests',
            description: 'You can resend again in 60 seconds. Please wait.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        const cooldownEnd = Date.now() + 60000; // 60 seconds from now
        localStorage.setItem('resend_cooldown', cooldownEnd.toString());
        toast({
          title: 'Success',
          description: 'Confirmation email resent. Please check your inbox.',
        });
        setRetryAfter(60); // Also set cooldown on success to prevent spamming
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
                  disabled={loading || retryAfter > 0}
                >
                  {loading ? 'Resending...' : retryAfter > 0 ? `Resend available in ${retryAfter}s` : 'Resend confirmation instructions'}
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
                disabled={loading || retryAfter > 0}
              >
                {loading
                  ? 'Creating Account...'
                  : retryAfter > 0
                    ? `Please wait ${retryAfter}s`
                    : 'Create Account'}
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
