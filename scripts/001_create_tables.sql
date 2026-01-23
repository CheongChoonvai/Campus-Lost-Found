-- Create items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('lost', 'found')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'deleted')),
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create contacts/messages table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX items_user_id_idx ON items(user_id);
CREATE INDEX items_item_type_idx ON items(item_type);
CREATE INDEX items_status_idx ON items(status);
CREATE INDEX items_category_idx ON items(category);
CREATE INDEX items_created_at_idx ON items(created_at DESC);
CREATE INDEX contacts_item_id_idx ON contacts(item_id);
CREATE INDEX contacts_sender_id_idx ON contacts(sender_id);
CREATE INDEX contacts_recipient_id_idx ON contacts(recipient_id);

-- Enable RLS (Row Level Security)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view all active items
CREATE POLICY "Anyone can view active items" ON items
  FOR SELECT USING (status = 'active');

-- RLS Policy: Users can only update/delete their own items
CREATE POLICY "Users can update their own items" ON items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items" ON items
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own items
CREATE POLICY "Users can insert items" ON items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can view contacts related to their items or messages
CREATE POLICY "Users can view contacts for their items" ON contacts
  FOR SELECT USING (
    auth.uid() = sender_id 
    OR auth.uid() = recipient_id
    OR auth.uid() IN (SELECT user_id FROM items WHERE id = item_id)
  );

-- RLS Policy: Users can insert contacts (send messages)
CREATE POLICY "Users can send messages" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policy: Users can update contacts they received (mark as read)
CREATE POLICY "Users can update contacts they received" ON contacts
  FOR UPDATE USING (auth.uid() = recipient_id);
