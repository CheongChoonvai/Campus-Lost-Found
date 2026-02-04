import { supabase } from './supabase/client';

const API_BASE = '/api';

// Helper to get auth token for API calls
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

// Helper to get optional auth headers (for public endpoints that can have auth)
async function getOptionalAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

// Helper for file uploads (special headers)
async function getUploadHeaders(fileName: string, userId: string): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'x-user-id': userId,
    'x-file-name': fileName,
  };
}

// Generic API call helper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || 'API request failed');
  }

  return json;
}

// ============= ITEMS API =============

export interface Item {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  item_type: 'lost' | 'found';
  photo_url: string | null;
  status: 'active' | 'resolved' | 'deleted';
  created_at: string;
  resolved_at?: string;
  posterName?: string;
}

export interface ItemFilters {
  itemType?: string;
  category?: string;
  status?: string;
  search?: string;
  userId?: string;
}

export async function getItems(filters: ItemFilters = {}): Promise<{ items: Item[] }> {
  const params = new URLSearchParams();
  if (filters.itemType) params.set('itemType', filters.itemType);
  if (filters.category) params.set('category', filters.category);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.userId) params.set('userId', filters.userId);

  const queryString = params.toString();
  
  // Public endpoint - use optional auth
  const headers = await getOptionalAuthHeaders();
  const res = await fetch(`${API_BASE}/items${queryString ? `?${queryString}` : ''}`, { headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch items');
  return json;
}

export async function getItem(id: string): Promise<{ item: Item; ownerName: string | null; isOwner: boolean }> {
  return apiCall<{ item: Item; ownerName: string | null; isOwner: boolean }>(`/items/${id}`);
}

export interface CreateItemData {
  title: string;
  description: string;
  category: string;
  location: string;
  item_type: 'lost' | 'found';
  photo_url?: string;
}

export async function createItem(data: CreateItemData): Promise<{ item: Item }> {
  return apiCall<{ item: Item }>('/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface UpdateItemData {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  item_type?: 'lost' | 'found';
  photo_url?: string;
  status?: 'active' | 'resolved' | 'deleted';
  resolved_at?: string;
}

export async function updateItem(id: string, data: UpdateItemData): Promise<{ item: Item }> {
  return apiCall<{ item: Item }>(`/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteItem(id: string): Promise<{ success: boolean }> {
  return apiCall<{ success: boolean }>(`/items/${id}`, {
    method: 'DELETE',
  });
}

// ============= CONTACTS/MESSAGES API =============

export interface Contact {
  id: string;
  item_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
  item?: { title: string | null };
}

export interface Conversation {
  otherId: string;
  otherEmail: string;
  messages: Contact[];
  lastMessage: Contact;
}

export async function getConversations(): Promise<{ conversations: Conversation[] }> {
  return apiCall<{ conversations: Conversation[] }>('/contacts');
}

export interface SendMessageData {
  item_id: string;
  recipient_id: string;
  message: string;
}

export async function sendMessage(data: SendMessageData): Promise<{ contact: Contact }> {
  return apiCall<{ contact: Contact }>('/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============= PROFILES API =============

export interface Profile {
  id: string;
  full_name: string | null;
}

export async function getProfile(id: string): Promise<{ profile: Profile }> {
  return apiCall<{ profile: Profile }>(`/profiles/${id}`);
}

// ============= UPLOAD API =============

export async function uploadFile(file: File, userId: string): Promise<{ publicUrl: string }> {
  const headers = await getUploadHeaders(file.name, userId);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body: file,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || 'Upload failed');
  }

  return json;
}
