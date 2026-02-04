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
import { AlertCircle, Mail } from 'lucide-react';
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, LoginFormValues } from "@/lib/schemas"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    setNeedsEmailConfirmation(false);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        // Handle specific error types
        const errorMessage = authError.message.toLowerCase();
        
        if (errorMessage.includes('email not confirmed')) {
          setNeedsEmailConfirmation(true);
          setError('Please check your email and click the confirmation link before signing in.');
        } else if (errorMessage.includes('invalid login credentials') || 
                   errorMessage.includes('invalid email or password')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (errorMessage.includes('email')) {
          setError('There was a problem with your email. Please check and try again.');
        } else if (errorMessage.includes('password')) {
          setError('Incorrect password. Please try again.');
        } else {
          setError(authError.message);
        }
        
        toast({
          title: 'Login Failed',
          description: 'Please check the error message below.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email Sent',
          description: 'A new confirmation email has been sent. Please check your inbox.',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to resend confirmation email.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold mx-auto mb-4">
            L&F
          </div>
          <h1 className="text-3xl font-bold text-foreground">Sign In</h1>
          <p className="mt-2 text-muted-foreground">
            Access your Campus Lost & Found account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Message Display */}
            {error && (
              <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
                needsEmailConfirmation 
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {needsEmailConfirmation ? (
                  <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{error}</p>
                  {needsEmailConfirmation && (
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      className="mt-2 text-sm font-semibold underline hover:no-underline"
                    >
                      Resend confirmation email
                    </button>
                  )}
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
