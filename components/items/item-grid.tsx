'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  item_type: 'lost' | 'found';
  photo_url: string | null;
  created_at: string;
}

interface ItemGridProps {
  items: Item[];
}

export function ItemGrid({ items }: ItemGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          {/* Item Image */}
          <div className="relative aspect-square bg-muted overflow-hidden">
            {item.photo_url ? (
              <img
                src={item.photo_url || "/placeholder.svg"}
                alt={item.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
            <Badge
              className={`absolute top-3 right-3 ${
                item.item_type === 'lost'
                  ? 'bg-destructive'
                  : 'bg-accent'
              }`}
            >
              {item.item_type === 'lost' ? 'Lost' : 'Found'}
            </Badge>
          </div>

          <CardHeader className="pb-3">
            <div>
              <h3 className="font-semibold text-foreground line-clamp-2">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{item.location}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
            </div>

            <Button asChild className="w-full bg-primary hover:bg-primary/90 group" size="sm">
              <Link href={`/dashboard/item/${item.id}`}>
                View Details
                <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
