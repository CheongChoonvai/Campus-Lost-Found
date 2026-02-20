'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getItem, updateItem, uploadFile } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Upload, ChevronLeft, Save } from 'lucide-react'

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [item, setItem] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [itemType, setItemType] = useState<'lost' | 'found'>('lost')
  const [status, setStatus] = useState<'active' | 'resolved' | 'deleted'>('active')
  
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const id = params?.id
        if (!id) {
          router.push('/dashboard')
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)

        const { item: data, isOwner: fetchedIsOwner } = await getItem(id as string)

        setItem(data)
        setTitle(data.title || '')
        setCategory(data.category || '')
        setLocation(data.location || '')
        setDescription(data.description || '')
        setItemType(data.item_type || 'lost')
        setStatus(data.status || 'active')
        setPhotoUrl(data.photo_url || null)
        setIsOwner(fetchedIsOwner)
        if (!fetchedIsOwner) {
          toast({ title: 'Forbidden', description: 'You are not the owner of this item', variant: 'destructive' })
          router.push('/dashboard')
          return
        }
      } catch (err) {
        console.error(err)
        toast({ title: 'Error', description: 'Failed to load item', variant: 'destructive' })
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      toast({ title: 'Error', description: 'You must be signed in', variant: 'destructive' });
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    setSaving(true)
    try {
      const updates: any = {
        title,
        category,
        location,
        description,
        item_type: itemType,
        photo_url: photoUrl || undefined,
        status,
      }

      // Manage resolved_at: set to now when marking resolved, clear when un-resolving
      if (status === 'resolved') {
        // if already has resolved_at keep it, otherwise set now
        updates.resolved_at = item.resolved_at || new Date().toISOString()
      } else {
        // clear resolved_at when not resolved
        updates.resolved_at = null
      }

      await updateItem(item.id, updates)

      toast({ title: 'Saved', description: 'Item updated successfully' })
      router.push(`/dashboard/item/${item.id}`)
    } catch (err: any) {
      if (err?.message?.includes('Forbidden')) {
        toast({ title: 'Forbidden', description: 'You do not have permission to update this item', variant: 'destructive' })
        return
      }
      console.error(err)
      toast({ title: 'Error', description: 'Failed to save item', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link 
          href={`/dashboard/item/${item?.id}`} 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-2xl font-bold mb-6">Edit Item</h1>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Compact Photo Upload */}
          <div className="bg-card rounded-lg border p-6">
            <label className="block text-sm font-medium mb-3">Item Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 relative bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/20 flex-shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
                    <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploading}
                  className="mb-2"
                >
                  {uploading ? 'Uploading...' : photoUrl ? 'Change Image' : 'Upload Image'}
                </Button>
                <p className="text-xs text-muted-foreground">{photoUrl ? 'Click to update the image' : 'Max 10MB • JPG, PNG, GIF'}</p>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Title</label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Blue Hydro Flask"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Type</label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as 'lost' | 'found')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'resolved' | 'deleted')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <Input 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  placeholder="e.g. Accessories"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Location</label>
                <Input 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="e.g. Library"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={4}
                placeholder="Describe the item..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href={`/dashboard/item/${item?.id}`}>
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving} className="min-w-[140px]">
              {saving ? 'Saving...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
