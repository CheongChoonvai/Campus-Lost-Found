'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [item, setItem] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [itemType, setItemType] = useState<'lost' | 'found'>('lost')

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

        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setItem(data)
        setTitle(data.title || '')
        setCategory(data.category || '')
        setLocation(data.location || '')
        setDescription(data.description || '')
        setItemType(data.item_type || 'lost')
        setIsOwner(data.user_id === user.id)
        if (data.user_id !== user.id) {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('items')
        .update({ title, category, location, description, item_type: itemType })
        .eq('id', item.id)

      if (error) {
        // Provide clearer message for forbidden (RLS) errors
        if ((error as any).status === 403) {
          toast({ title: 'Forbidden', description: 'You do not have permission to update this item', variant: 'destructive' })
          return
        }
        throw error
      }

      toast({ title: 'Saved', description: 'Item updated successfully' })
      router.push(`/dashboard/item/${item.id}`)
    } catch (err) {
      console.error(err)
      toast({ title: 'Error', description: 'Failed to save item', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Item</h1>
        <Link href={`/dashboard/item/${item?.id}`} className="text-sm text-primary hover:underline">Back</Link>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-1">Category</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-1">Location</label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-1">Type</label>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value as 'lost' | 'found')}
            className="border-input rounded-md px-3 py-2 w-full"
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-1">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          <Link href={`/dashboard/item/${item?.id}`} className="ml-2">
            <Button variant="ghost">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
