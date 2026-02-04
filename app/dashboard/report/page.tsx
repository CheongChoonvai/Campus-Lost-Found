'use client';

import React from "react"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { createItem, uploadFile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { reportItemSchema, ReportItemFormValues } from "@/lib/schemas"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export default function ReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');

  const form = useForm<ReportItemFormValues>({
    resolver: zodResolver(reportItemSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      location: "",
      item_type: "lost",
    },
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
      } else {
        setUser(user);
      }
    };

    checkAuth();
  }, []);

  const categories = [
    'Electronics',
    'Clothing',
    'Accessories',
    'Keys',
    'Wallet',
    'Books',
    'Bags',
    'Documents',
    'Other',
  ];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      toast({ title: 'Error', description: 'You must be signed in to upload', variant: 'destructive' });
      return;
    }

    // Client-side validations
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'Error',
        description: 'File is too large. Max size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const { publicUrl } = await uploadFile(file, user.id);
      setPhotoUrl(publicUrl);
      toast({ title: 'Success', description: 'Photo uploaded successfully' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ReportItemFormValues) => {
    setLoading(true);
    try {
      await createItem({
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        item_type: data.item_type,
        photo_url: photoUrl || undefined,
      });

      toast({
        title: 'Success',
        description: 'Item reported successfully!',
      });
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to report item',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header provided by app/dashboard/layout.tsx */}

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Report an Item</CardTitle>
            <CardDescription>
              Report a lost or found item to help your campus community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Item Type */}
                <FormField
                  control={form.control}
                  name="item_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select item type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lost">Lost Item</SelectItem>
                          <SelectItem value="found">Found Item</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Black iPhone 14" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the item in detail (color, condition, distinctive marks, etc.)"
                          {...field}
                          disabled={loading}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Library 3rd Floor, Dining Hall"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label>Photo (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {photoUrl ? (
                      <div className="space-y-4">
                        <img
                          src={photoUrl || "/placeholder.svg"}
                          alt="Uploaded photo"
                          className="max-h-40 mx-auto rounded"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPhotoUrl('')}
                          disabled={uploading}
                        >
                          Change Photo
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={uploading}
                          className="hidden"
                          id="photo-input"
                        />
                        <label
                          htmlFor="photo-input"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </span>
                          <span className="text-xs text-muted-foreground">
                            PNG, JPG, GIF up to 10MB
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={loading || uploading}
                  >
                    {loading ? 'Reporting...' : 'Report Item'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => router.back()}
                    disabled={loading || uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
