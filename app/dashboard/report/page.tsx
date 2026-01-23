'use client';

import React from "react"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function ReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    item_type: 'lost' as 'lost' | 'found',
  });

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
      // POST the file to the server API that uses the service role key to upload securely
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'x-file-name': file.name,
          // content-type will be set automatically by the browser for Blobs when using body as file
        },
        body: file,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Upload failed');

      setPhotoUrl(json.publicUrl);
      toast({ title: 'Success', description: 'Photo uploaded successfully' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.category || !formData.location) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('items').insert([
        {
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          item_type: formData.item_type,
          photo_url: photoUrl || null,
          status: 'active',
        },
      ]);

      if (error) throw error;

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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                L&F
              </div>
              <span className="text-lg font-bold text-foreground">Campus Lost & Found</span>
            </div>
          </div>
        </div>
      </header>

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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Item Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Black iPhone 14"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the item in detail (color, condition, distinctive marks, etc.)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  disabled={loading}
                  rows={4}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Library 3rd Floor, Dining Hall"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
