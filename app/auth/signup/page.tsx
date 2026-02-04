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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signUpSchema, SignUpFormValues } from "@/lib/schemas"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirmScreen, setShowConfirmScreen] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState('');
  const [retryAfter, setRetryAfter] = useState(0);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    },
  })

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

  const onSubmit = async (data: SignUpFormValues) => {
    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
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
          setSignedUpEmail(data.email);
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
        // Check if user already exists (Supabase returns empty identities array for existing users)
        const userAlreadyExists = authData?.user?.identities?.length === 0;
        
        if (userAlreadyExists) {
          // User already exists - show a helpful message
          setSignedUpEmail(data.email);
          setShowConfirmScreen(true);
          toast({
            title: 'Email Already Registered',
            description: 'This email may already be registered. Please check your inbox for a previous confirmation email, or try logging in.',
            variant: 'destructive',
          });
        } else {
          // New user created successfully
          setSignedUpEmail(data.email);
          setShowConfirmScreen(true);
          toast({
            title: 'Success',
            description: 'Account created. Check your email to confirm your account.',
          });
          // Note: Profile creation is handled automatically by a database trigger
          // (handle_auth_user_insert) that runs when the user is created in auth.users.
          // The full_name is extracted from the user metadata we passed in options.data above.
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@campus.edu" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={loading} />
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
            </Form>

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
